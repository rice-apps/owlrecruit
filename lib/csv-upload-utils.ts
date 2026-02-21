/**
 * CSV Upload Utility Functions
 *
 * This file contains reusable logic for CSV upload processing.
 * These functions are used by both /api/applications and /api/interviews.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import {
  CSV_RESERVED_COLUMNS,
  REQUIRED_CSV_COLUMNS,
  ERROR_MESSAGES,
  VALIDATION_CONFIG,
} from "./csv-upload-config";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface CSVRow {
  [key: string]: unknown;
}

export interface ProcessingError {
  row: number;
  netid?: string;
  error: string;
}

export interface UserLookupResult {
  id: string;
  net_id: string;
}

export interface OpeningLookupResult {
  org_id: string;
}

export interface UserResult {
  id: string;
  net_id: string;
  name: string;
}

export interface UploadResult {
  successCount: number;
  errors: ProcessingError[];
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates that a CSV row has all required fields.
 *
 * HOW TO EXTEND:
 * Add custom validation logic here (e.g., email format, phone numbers)
 */
export function validateRequiredFields(row: CSVRow): string | null {
  for (const requiredCol of REQUIRED_CSV_COLUMNS as readonly string[]) {
    if (!row[requiredCol]) {
      return `Missing required field: ${requiredCol}`;
    }
  }
  return null;
}

/**
 * Validates that netid is present and non-empty.
 */
export function validateNetId(netid: unknown): boolean {
  return !!netid && typeof netid === "string" && netid.trim().length > 0;
}

// =============================================================================
// DATA TRANSFORMATION FUNCTIONS
// =============================================================================

/**
 * Extracts form responses from a CSV row.
 * All columns except reserved ones become form responses.
 *
 * HOW TO MODIFY:
 * - Change CSV_RESERVED_COLUMNS in config to exclude different fields
 * - Add custom transformation logic here (e.g., parse dates, format text)
 *
 * @param row - The CSV row data
 * @returns Object with question/answer pairs
 */
export function extractFormResponses(row: CSVRow): Record<string, unknown> {
  const formResponses: Record<string, unknown> = {};
  const reservedColumns = Object.values(CSV_RESERVED_COLUMNS) as string[];

  for (const [key, value] of Object.entries(row)) {
    if (!reservedColumns.includes(key)) {
      formResponses[key] = value;
    }
  }

  return formResponses;
}

/**
 * Builds a database record for applications.
 *
 * HOW TO MODIFY:
 * 1. Add new fields by adding them to the returned object
 * 2. Change field names in csv-upload-config.ts DATABASE_FIELD_MAPPING
 * 3. Add custom logic for field transformations
 *
 * @param orgId - Organization ID from opening
 * @param openingId - Opening ID from request
 * @param userId - User ID from netid lookup
 * @param formResponses - Extracted form responses
 * @param status - Application status (optional, falls back to default)
 * @returns Database record object
 */
export function buildApplicationRecord(
  orgId: string,
  openingId: string,
  userId: string,
  formResponses: Record<string, unknown>,
  status?: string,
): Record<string, unknown> {
  return {
    org_id: orgId,
    opening_id: openingId,
    applicant_id: userId,
    form_responses: formResponses,
    status: status || "Applied", // Default if not provided
    // Add more fields here as needed
    // Example:
    // position: formResponses['Position'] || '',
    // submitted_at: new Date().toISOString(),
  };
}

/**
 * Builds a database record for interviews.
 *
 * HOW TO MODIFY:
 * Same as buildApplicationRecord - add fields as needed
 *
 * @param orgId - Organization ID from opening
 * @param openingId - Opening ID from request
 * @param userId - User ID from netid lookup
 * @param feedback - Extracted feedback responses
 * @returns Database record object
 */
export function buildInterviewRecord(
  orgId: string,
  openingId: string,
  userId: string,
  feedback: Record<string, unknown>,
): Record<string, unknown> {
  return {
    org_id: orgId,
    opening_id: openingId,
    applicant_id: userId,
    feedback: feedback,
    // Add more fields here as needed
    // Example:
    // interviewer_id: getCurrentUserId(),
    // interview_date: feedback['Interview Date'],
  };
}

// =============================================================================
// DATABASE LOOKUP FUNCTIONS
// =============================================================================

/**
 * Looks up a user by their netid in the users table.
 */
export async function lookupUserByNetId(
  supabase: SupabaseClient,
  netid: string,
): Promise<UserResult | null> {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, net_id, name")
    .eq("net_id", netid)
    .maybeSingle();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Looks up an applicant by their netid in the applicants table.
 */
export async function lookupApplicantByNetId(
  supabase: SupabaseClient,
  netid: string,
): Promise<UserResult | null> {
  const { data: applicant, error } = await supabase
    .from("applicants")
    .select("id, net_id, name")
    .eq("net_id", netid)
    .maybeSingle();

  if (error || !applicant) {
    return null;
  }

  return applicant;
}

/**
 * Ensures an applicant exists and returns their record.
 */
export async function ensureApplicant(
  supabase: SupabaseClient,
  netid: string,
  name: string,
): Promise<UserResult> {
  // 1. Try lookup first
  const existing = await lookupApplicantByNetId(supabase, netid);
  if (existing) {
    // Optionally update name if it's different/placeholder
    if (existing.name === "-" && name !== "-") {
      const { data: updated, error: updateError } = await supabase
        .from("applicants")
        .update({ name })
        .eq("id", existing.id)
        .select()
        .single();
      if (!updateError && updated) return updated;
    }
    return existing;
  }

  // 2. Insert if not found
  const { data: applicant, error } = await supabase
    .from("applicants")
    .insert({ net_id: netid, name })
    .select()
    .single();

  if (error || !applicant) {
    throw new Error(`Failed to create applicant: ${error?.message}`);
  }

  return applicant;
}

/**
 * Looks up an opening and returns its org_id.
 *
 * HOW TO MODIFY:
 * - Add additional opening data to select() if needed
 * - Add validation logic (e.g., check if opening is active)
 *
 * @param supabase - Supabase client
 * @param openingId - Opening UUID
 * @returns Opening object with org_id or null if not found
 */
export async function lookupOpening(
  supabase: SupabaseClient,
  openingId: string,
): Promise<OpeningLookupResult | null> {
  const { data: opening, error } = await supabase
    .from("openings")
    .select("org_id")
    .eq("id", openingId)
    .single();

  if (error || !opening) {
    return null;
  }

  return opening;
}

// =============================================================================
// BATCH PROCESSING FUNCTIONS
// =============================================================================

/**
 * Processes multiple CSV rows and builds database records.
 *
 * This function:
 * 1. Validates each row
 * 2. Looks up users by netid
 * 3. Builds database records
 * 4. Collects errors for invalid rows
 *
 * HOW TO MODIFY:
 * - Add custom validation by editing validateRequiredFields
 * - Add custom transformations in buildApplicationRecord/buildInterviewRecord
 * - Change error handling behavior in VALIDATION_CONFIG
 *
 * @param supabase - Supabase client
 * @param rows - Parsed CSV rows
 * @param orgId - Organization ID
 * @param openingId - Opening ID
 * @param buildRecordFn - Function to build database record
 * @param defaultStatus - Default status for new records (optional)
 * @param tableName - Optional table name to check for duplicates (e.g. 'applications')
 * @param adminClient - Optional admin client for creating auth users
 * @returns Object with valid records and errors
 */
export async function processCSVRows<T>(
  supabase: SupabaseClient,
  rows: CSVRow[],
  orgId: string,
  openingId: string,
  buildRecordFn: (
    orgId: string,
    openingId: string,
    userId: string,
    data: Record<string, unknown>,
    status?: string,
  ) => T,
  defaultStatus?: string,
  tableName?: string,
  columnMappings?: Record<string, string>,
): Promise<{ records: T[]; errors: ProcessingError[] }> {
  const records: T[] = [];
  const errors: ProcessingError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;

    // Validate required fields
    const validationError = validateRequiredFields(row);
    if (validationError) {
      errors.push({ row: rowNumber, error: validationError });
      if (!VALIDATION_CONFIG.skipInvalidRows) break;
      continue;
    }

    // Validate netid
    if (!validateNetId(row[CSV_RESERVED_COLUMNS.NETID])) {
      errors.push({ row: rowNumber, error: ERROR_MESSAGES.MISSING_NETID });
      if (!VALIDATION_CONFIG.skipInvalidRows) break;
      continue;
    }

    // Look up or create applicant
    let user = await lookupApplicantByNetId(
      supabase,
      row[CSV_RESERVED_COLUMNS.NETID] as string,
    );

    // If applicant not found, create
    if (!user) {
      const name =
        ((columnMappings?.name && row[columnMappings.name]) as string) || "-";
      try {
        user = await ensureApplicant(
          supabase,
          row[CSV_RESERVED_COLUMNS.NETID] as string,
          name,
        );
      } catch (err: any) {
        errors.push({
          row: rowNumber,
          netid: row[CSV_RESERVED_COLUMNS.NETID] as string,
          error: `Failed to create applicant: ${err.message}`,
        });
        if (!VALIDATION_CONFIG.skipInvalidRows) break;
        continue;
      }
    }

    // Extract form responses
    const formResponses = extractFormResponses(row);

    // Build record
    const record = buildRecordFn(
      orgId,
      openingId,
      user.id,
      formResponses,
      defaultStatus,
    );
    records.push(record);
  }

  return { records, errors };
}

/**
 * High-level helper to process and upload CSV applications.
 */
export async function processAndUploadApplications(
  supabase: SupabaseClient,
  params: {
    openingId: string;
    csvData: any[];
    columnMappings: Record<string, string>;
    customQuestions: Array<{ id: string; text: string }>;
    existingApplicants?: Map<string, { applicantId: string; name: string }>;
  },
): Promise<UploadResult> {
  const {
    openingId,
    csvData,
    columnMappings,
    customQuestions,
    existingApplicants,
  } = params;
  const results: UploadResult = { successCount: 0, errors: [] };

  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    const rowNumber = i + 1;
    const netid = row[columnMappings.netid];
    const name = row[columnMappings.name];

    if (!netid || !name) {
      results.errors.push({
        row: rowNumber,
        error: "Missing required fields: NetID or Name",
      });
      continue;
    }

    try {
      // 1. Ensure Applicant
      let userId: string;

      // Check cache first
      if (existingApplicants?.has(netid)) {
        const existing = existingApplicants.get(netid)!;
        userId = existing.applicantId;

        // Optional: If existing name is "-" and new name is real, update it?
        // logic from ensureApplicant:
        // if (existing.name === "-" && name !== "-") { update... }
        // We'll trust ensureApplicant logic if we think we need an update,
        // OR we can just skip if we don't care about name updates for existing applicants.
        // For efficiency, let's skip the DB read if name is good or we don't assume update.
        // But if we want perfection:
        if (existing.name === "-" && name !== "-") {
          // If name needs update, we call update directly or use ensureApplicant (which does a read first)
          // calling ensureApplicant is safer but does a read.
          // We can just call update directly since we have the ID.
          const { error: updateError } = await supabase
            .from("applicants")
            .update({ name })
            .eq("id", userId);
          if (updateError) console.error("Error updating name:", updateError);
        }
      } else {
        // Not in our cache of "applicants for this opening".
        // They might still exist in global 'applicants' table.
        const user = await ensureApplicant(supabase, netid, name);
        userId = user.id;
      }

      // 2. Build form_responses
      const formResponses: Record<string, any> = {};
      formResponses.name = name;
      formResponses.netid = netid;
      if (columnMappings.year) formResponses.year = row[columnMappings.year];
      if (columnMappings.major) formResponses.major = row[columnMappings.major];

      customQuestions.forEach((q) => {
        if (columnMappings[q.id]) {
          formResponses[q.text] = row[columnMappings[q.id]];
        }
      });

      // 3. Upsert Application
      const { error: appError } = await supabase.from("applications").upsert(
        {
          opening_id: openingId,
          applicant_id: userId,
          form_responses: formResponses,
          status: "Applied",
        },
        { onConflict: "opening_id, applicant_id" },
      );

      if (appError) {
        throw appError;
      } else {
        results.successCount++;
      }
    } catch (err: any) {
      results.errors.push({
        row: rowNumber,
        netid,
        error: err.message || "Unknown error occurred",
      });
    }
  }

  return results;
}

// =============================================================================
// RESPONSE FORMATTING
// =============================================================================

/**
 * Formats a successful response.
 */
export function formatSuccessResponse(
  data: unknown[],
  errorCount: number,
  errors: ProcessingError[],
) {
  return {
    data,
    inserted_count: data.length,
    skipped_count: errorCount,
    errors: errorCount > 0 ? errors : undefined,
  };
}

/**
 * Formats an error response.
 */
export function formatErrorResponse(message: string, details?: unknown) {
  return {
    error: message,
    details,
  };
}
