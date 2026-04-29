import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { ensureApplicant } from "@/lib/csv-upload-utils";
import { createRequestLogger } from "@/lib/logger";
import { DEFAULT_APPLICATION_STATUS } from "@/types/app";
import type { TablesInsert } from "@/types/database";
import type {
  ColumnMapping,
  CustomQuestion,
} from "@/app/protected/opening/[openingId]/components/useUploadWizard";

type Params = Promise<{ orgId: string; openingId: string }>;

interface UploadBody {
  csvData: Record<string, unknown>[];
  columnMappings: ColumnMapping;
  customQuestions: CustomQuestion[];
  existingApplicants: [string, { applicantId: string; name: string }][];
}

interface UploadError {
  row?: number;
  error: string;
}

export async function POST(request: Request, { params }: { params: Params }) {
  const { orgId, openingId } = await params;
  const log = createRequestLogger({
    method: "POST",
    path: `/api/org/${orgId}/opening/${openingId}/upload`,
    org_id: orgId,
    opening_id: openingId,
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    log.flush(401);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  log.set({ user_id: user.id });

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .single();

  if (membership?.role !== "admin") {
    log.flush(403);
    return NextResponse.json(
      { error: "Only admins can upload applications" },
      { status: 403 },
    );
  }

  const { data: opening } = await supabase
    .from("openings")
    .select("org_id")
    .eq("id", openingId)
    .single();

  if (!opening) {
    log.flush(404);
    return NextResponse.json({ error: "Opening not found" }, { status: 404 });
  }

  if (opening.org_id !== orgId) {
    log.flush(400);
    return NextResponse.json(
      { error: "Opening does not belong to this organization" },
      { status: 400 },
    );
  }

  const body: UploadBody = await request.json();
  const { csvData, columnMappings, customQuestions } = body;

  if (!csvData?.length) {
    log.flush(400);
    return NextResponse.json(
      { error: "No data rows found in upload" },
      { status: 400 },
    );
  }

  log.set({ csv_row_count: csvData.length });

  const errors: UploadError[] = [];
  const applicationRecords: TablesInsert<"applications">[] = [];

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    const rowNumber = i + 1;

    const netid = columnMappings.netid
      ? (row[columnMappings.netid] as string | undefined)?.trim()
      : undefined;

    if (!netid) {
      errors.push({ row: rowNumber, error: "Missing required field: netid" });
      continue;
    }

    const name = columnMappings.name
      ? ((row[columnMappings.name] as string | undefined)?.trim() ?? "-")
      : "-";

    let applicant;
    try {
      applicant = await ensureApplicant(supabase, netid, name);
    } catch (err) {
      errors.push({
        row: rowNumber,
        error: `Failed to create applicant: ${err instanceof Error ? err.message : String(err)}`,
      });
      continue;
    }

    const formResponses: Record<string, unknown> = {
      name,
      netid,
    };

    if (columnMappings.year && row[columnMappings.year]) {
      formResponses["year"] = row[columnMappings.year];
    }
    if (columnMappings.major && row[columnMappings.major]) {
      formResponses["major"] = row[columnMappings.major];
    }
    for (const q of customQuestions) {
      const col = columnMappings[q.id];
      if (col && row[col]) {
        formResponses[q.text] = row[col];
      }
    }

    applicationRecords.push({
      opening_id: openingId,
      applicant_id: applicant.id,
      form_responses:
        formResponses as TablesInsert<"applications">["form_responses"],
      status:
        DEFAULT_APPLICATION_STATUS as TablesInsert<"applications">["status"],
    });
  }

  if (applicationRecords.length === 0) {
    log.flush(400);
    return NextResponse.json(
      { error: "No valid records to insert", errors },
      { status: 400 },
    );
  }

  const { data, error: upsertError } = await supabase
    .from("applications")
    .upsert(applicationRecords, { onConflict: "opening_id, applicant_id" })
    .select();

  if (upsertError) {
    log.error("error upserting applications", upsertError);
    log.flush(500);
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  log.set({ upserted_count: data?.length ?? 0, error_count: errors.length });
  log.flush(200);
  return NextResponse.json({
    successCount: data?.length ?? 0,
    errors,
  });
}
