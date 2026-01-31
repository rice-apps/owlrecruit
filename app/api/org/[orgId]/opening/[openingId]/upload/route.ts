import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  processAndUploadApplications,
  UploadResult,
} from "@/lib/csv-upload-utils";

export async function POST(
  request: Request,
  props: { params: Promise<{ orgId: string; openingId: string }> },
) {
  const params = await props.params;
  const { openingId } = params;

  try {
    const supabase = await createClient();

    // Parse the request body
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

    // Reconstruct Map from JSON object if needed, or pass object if utils updated.
    // existingApplicants comes as { [key: string]: { applicantId: string, name: string } } from JSON
    // We need to convert it back to a Map or update utils to accept Record/Object.
    // For now, let's reconstruct key Map for compatibility/performance.
    let existingApplicantsMap:
      | Map<string, { applicantId: string; name: string }>
      | undefined = undefined;

    if (existingApplicantsObj) {
      existingApplicantsMap = new Map();
      // Assuming existingApplicantsObj is an array of entries or an object.
      // If it was sent as Array.from(map.entries()) from client:
      if (Array.isArray(existingApplicantsObj)) {
        existingApplicantsObj.forEach(([key, val]: [string, any]) => {
          existingApplicantsMap!.set(key, val);
        });
      }
    }

    // Call shared utility
    // We need to be careful: the utility was written for client-side supabase client type mainly?
    // Actually @supabase/supabase-js SupabaseClient type is generic.
    // Ideally code should work for both.

    const results: UploadResult = await processAndUploadApplications(supabase, {
      openingId,
      csvData,
      columnMappings,
      customQuestions: customQuestions || [],
      existingApplicants: existingApplicantsMap,
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
