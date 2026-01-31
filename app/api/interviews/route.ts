/**
 * API Route: /api/interviews
 *
 * Handles CSV uploads for interview feedback data.
 *
 * QUICK START GUIDE:
 * - To add/remove CSV columns: They're automatically handled as feedback
 * - To change database fields: Edit buildInterviewRecord in csv-upload-utils.ts
 * - To modify validation: Edit validation functions in csv-upload-utils.ts
 */

import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";
import Papa from "papaparse";
import { ERROR_MESSAGES } from "@/lib/csv-upload-config";
import {
  buildInterviewRecord,
  type CSVRow,
  formatErrorResponse,
  formatSuccessResponse,
  lookupOpening,
  processCSVRows,
} from "@/lib/csv-upload-utils";

export async function POST(request: NextRequest) {
  try {
    // ==========================================================================
    // STEP 1: Validate Request
    // ==========================================================================

    // Check content type
    const contentType = request.headers.get("content-type");
    if (
      !contentType ||
      (!contentType.includes("text/csv") && !contentType.includes("text/plain"))
    ) {
      return new Response(
        JSON.stringify(
          formatErrorResponse(ERROR_MESSAGES.INVALID_CONTENT_TYPE),
        ),
        { status: 400 },
      );
    }

    // Get opening_id from header
    const openingId = request.headers.get("X-Opening-Id");
    if (!openingId) {
      return new Response(
        JSON.stringify(formatErrorResponse(ERROR_MESSAGES.MISSING_OPENING_ID)),
        { status: 400 },
      );
    }

    // ==========================================================================
    // STEP 2: Parse CSV
    // ==========================================================================

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
        JSON.stringify(
          formatErrorResponse("CSV parsing error", formattedErrors),
        ),
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

    // ==========================================================================
    // STEP 3: Validate Opening and Get Org ID
    // ==========================================================================

    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify(formatErrorResponse("Unauthorized")), {
        status: 401,
      });
    }



    const opening = await lookupOpening(supabase, openingId);
    if (!opening) {
      return new Response(
        JSON.stringify(formatErrorResponse(ERROR_MESSAGES.OPENING_NOT_FOUND)),
        { status: 404 },
      );
    }

    const orgId = opening.org_id;

    // ==========================================================================
    // STEP 4: Process CSV Rows
    //
    // This function handles:
    // - Validating each row
    // - Looking up users by netid
    // - Building database records
    // - Collecting errors for invalid rows
    //
    // TO CUSTOMIZE: Edit processCSVRows in csv-upload-utils.ts
    // ==========================================================================

    const { records: interviewRecords, errors } = await processCSVRows(
      supabase,
      parsedData,
      orgId,
      openingId,
      buildInterviewRecord,
      undefined, // No default status
      undefined, // No duplicate check for interviews (or 'interviews' if desired)
    );

    // Check if all rows failed
    if (interviewRecords.length === 0) {
      return new Response(
        JSON.stringify(
          formatErrorResponse(ERROR_MESSAGES.NO_VALID_RECORDS, errors),
        ),
        { status: 400 },
      );
    }

    // ==========================================================================
    // STEP 5: Insert into Database
    // ==========================================================================

    const { data, error } = await supabase
      .from("interviews")
      .insert(interviewRecords)
      .select();

    if (error) {
      return new Response(JSON.stringify(formatErrorResponse(error.message)), {
        status: 500,
      });
    }

    // ==========================================================================
    // STEP 6: Return Success Response
    // ==========================================================================

    return new Response(
      JSON.stringify(formatSuccessResponse(data, errors.length, errors)),
      { status: 200 },
    );
  } catch (err) {
    return new Response(
      JSON.stringify(
        formatErrorResponse(
          err instanceof Error ? err.message : "Unknown error",
        ),
      ),
      { status: 500 },
    );
  }
}
