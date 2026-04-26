import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";
import Papa from "papaparse";
import { DEFAULT_UPLOAD_STATUS, ERROR_MESSAGES } from "@/lib/csv-upload-config";
import {
  processCSVRows,
  buildApplicationRecord,
  lookupOpening,
  formatSuccessResponse,
  formatErrorResponse,
  type CSVRow,
} from "@/lib/csv-upload-utils";
import { createRequestLogger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const log = createRequestLogger({
    method: "POST",
    path: `/api/org/${orgId}/applications`,
    org_id: orgId,
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    log.flush(401);
    return new Response(JSON.stringify(formatErrorResponse("Unauthorized")), {
      status: 401,
    });
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
    return new Response(
      JSON.stringify(
        formatErrorResponse("Only admins can upload applications"),
      ),
      { status: 403 },
    );
  }

  const contentType = request.headers.get("content-type");
  if (
    !contentType ||
    (!contentType.includes("text/csv") && !contentType.includes("text/plain"))
  ) {
    log.flush(400);
    return new Response(
      JSON.stringify(formatErrorResponse(ERROR_MESSAGES.INVALID_CONTENT_TYPE)),
      { status: 400 },
    );
  }

  const openingId = request.headers.get("X-Opening-Id");
  if (!openingId) {
    log.flush(400);
    return new Response(
      JSON.stringify(formatErrorResponse(ERROR_MESSAGES.MISSING_OPENING_ID)),
      { status: 400 },
    );
  }
  log.set({ opening_id: openingId });

  const csvText = await request.text();

  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (result.errors.length > 0) {
    const formattedErrors = result.errors.map((err) => ({
      row: err.row,
      type: err.type,
      code: err.code,
      message: err.message,
    }));
    log.warn("csv parsing errors", { error_count: formattedErrors.length });
    log.flush(400);
    return new Response(
      JSON.stringify(formatErrorResponse("CSV parsing error", formattedErrors)),
      { status: 400 },
    );
  }

  const parsedData = result.data as CSVRow[];

  if (parsedData.length === 0) {
    log.flush(400);
    return new Response(
      JSON.stringify(formatErrorResponse(ERROR_MESSAGES.NO_VALID_DATA)),
      { status: 400 },
    );
  }
  log.set({ csv_row_count: parsedData.length });

  const opening = await lookupOpening(supabase, openingId);
  if (!opening) {
    log.flush(404);
    return new Response(
      JSON.stringify(formatErrorResponse(ERROR_MESSAGES.OPENING_NOT_FOUND)),
      { status: 404 },
    );
  }

  if (opening.org_id !== orgId) {
    log.flush(400);
    return new Response(
      JSON.stringify(
        formatErrorResponse("Opening does not belong to this organization"),
      ),
      { status: 400 },
    );
  }

  const { records: applicationRecords, errors } = await processCSVRows(
    supabase,
    parsedData,
    orgId,
    openingId,
    buildApplicationRecord,
    DEFAULT_UPLOAD_STATUS,
    "applications",
    undefined,
  );

  if (applicationRecords.length === 0) {
    log.flush(400);
    return new Response(
      JSON.stringify(
        formatErrorResponse(ERROR_MESSAGES.NO_VALID_RECORDS, errors),
      ),
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("applications")
    .upsert(applicationRecords, { onConflict: "opening_id, applicant_id" })
    .select();

  if (error) {
    log.error("error upserting csv applications", error);
    log.flush(500);
    return new Response(JSON.stringify(formatErrorResponse(error.message)), {
      status: 500,
    });
  }

  log.set({ upserted_count: data?.length ?? 0, skipped_count: errors.length });
  log.flush(200);
  return new Response(
    JSON.stringify(formatSuccessResponse(data, errors.length, errors)),
    { status: 200 },
  );
}
