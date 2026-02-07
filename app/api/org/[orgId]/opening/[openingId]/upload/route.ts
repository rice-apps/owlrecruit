import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import {
  processAndUploadApplications,
  UploadResult,
} from "@/lib/csv-upload-utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string; openingId: string }> },
) {
  const { orgId, openingId } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user!.id)
    .eq("org_id", orgId)
    .single();

  if (membership?.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can upload applications" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const {
    csvData,
    columnMappings,
    customQuestions,
    existingApplicants: existingApplicantsObj,
  } = body;

  if (!csvData || !columnMappings) {
    return NextResponse.json(
      { error: "Missing required fields: csvData or columnMappings" },
      { status: 400 },
    );
  }

  let existingApplicantsMap:
    | Map<string, { applicantId: string; name: string }>
    | undefined = undefined;

  if (existingApplicantsObj && Array.isArray(existingApplicantsObj)) {
    existingApplicantsMap = new Map();
    existingApplicantsObj.forEach(
      ([key, val]: [string, { applicantId: string; name: string }]) => {
        existingApplicantsMap!.set(key, val);
      },
    );
  }

  const results: UploadResult = await processAndUploadApplications(
    adminSupabase,
    {
      openingId,
      csvData,
      columnMappings,
      customQuestions: customQuestions || [],
      existingApplicants: existingApplicantsMap,
    },
  );

  return NextResponse.json(results);
}
