import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  processAndUploadApplications,
  UploadResult,
} from "@/lib/csv-upload-utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string; openingId: string }> },
) {
  const { openingId } = await params;
  const supabase = await createClient();

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

  const results: UploadResult = await processAndUploadApplications(supabase, {
    openingId,
    csvData,
    columnMappings,
    customQuestions: customQuestions || [],
    existingApplicants: existingApplicantsMap,
  });

  return NextResponse.json(results);
}
