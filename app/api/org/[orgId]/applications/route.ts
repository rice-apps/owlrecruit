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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;

  const contentType = request.headers.get("content-type");
  if (
    !contentType ||
    (!contentType.includes("text/csv") && !contentType.includes("text/plain"))
  ) {
    return new Response(
      JSON.stringify(formatErrorResponse(ERROR_MESSAGES.INVALID_CONTENT_TYPE)),
      { status: 400 },
    );
  }

  const openingId = request.headers.get("X-Opening-Id");
  if (!openingId) {
    return new Response(
      JSON.stringify(formatErrorResponse(ERROR_MESSAGES.MISSING_OPENING_ID)),
      { status: 400 },
    );
  }

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
    return new Response(
      JSON.stringify(formatErrorResponse("CSV parsing error", formattedErrors)),
      { status: 400 },
    );
  }

  const parsedData = result.data as CSVRow[];

  if (parsedData.length === 0) {
    return new Response(
      JSON.stringify(formatErrorResponse(ERROR_MESSAGES.NO_VALID_DATA)),
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const opening = await lookupOpening(supabase, openingId);
  if (!opening) {
    return new Response(
      JSON.stringify(formatErrorResponse(ERROR_MESSAGES.OPENING_NOT_FOUND)),
      { status: 404 },
    );
  }

  if (opening.org_id !== orgId) {
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
    return new Response(JSON.stringify(formatErrorResponse(error.message)), {
      status: 500,
    });
  }

  return new Response(
    JSON.stringify(formatSuccessResponse(data, errors.length, errors)),
    { status: 200 },
  );
}
