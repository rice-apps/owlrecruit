/**
 * API Route: /api/applications
 *
 * Handles CSV uploads for application data.
 *
 * QUICK START GUIDE:
 * - To change default status: Edit DEFAULT_UPLOAD_STATUS in csv-upload-config.ts
 * - To add/remove CSV columns: They're automatically handled as form responses
 * - To change database fields: Edit buildApplicationRecord in csv-upload-utils.ts
 * - To modify validation: Edit validation functions in csv-upload-utils.ts
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";
import Papa from "papaparse";
import { DEFAULT_UPLOAD_STATUS, ERROR_MESSAGES } from "@/lib/csv-upload-config";
import {
  processCSVRows,
  buildApplicationRecord,
  lookupOpening,
  formatSuccessResponse,
  formatErrorResponse,
  upsertQuestionsFromCSV,
  type CSVRow,
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

    const adminClient = createAdminClient();

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

    const { records: applicationRecords, errors } = await processCSVRows(
      supabase,
      parsedData,
      orgId,
      openingId,
      buildApplicationRecord,
      DEFAULT_UPLOAD_STATUS,
      "applications", // Check for duplicates in applications table
      undefined, // No column mappings provided via simple API link for now
    );

    // Check if all rows failed
    if (applicationRecords.length === 0) {
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
    console.log("step 5 happening now")
    const { data, error } = await supabase
      .from("applications")
      .upsert(applicationRecords, { onConflict: "opening_id, applicant_id" })
      .select();

    if (error) {
      return new Response(JSON.stringify(formatErrorResponse(error.message)), {
        status: 500,
      });
    }

    // Upsert questions from CSV headers into questions table
    try {
      await upsertQuestionsFromCSV(supabase, openingId, parsedData);
    } catch (questionError) {
      console.error("Failed to upsert questions:", questionError);
      // Continue even if questions fail - don't block the response
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
