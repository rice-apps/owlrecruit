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
 * Looks up a user by their netid.
 *
 * HOW TO MODIFY:
 * - Change table name if using different table
 * - Change column name if using different field for netid
 * - Add additional user data to select() if needed
 *
 * @param supabase - Supabase client
 * @param netid - User's netid
 * @returns User object or null if not found
 */
export async function lookupUserByNetId(
  supabase: SupabaseClient,
  netid: string,
): Promise<UserLookupResult | null> {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, net_id")
    .eq("net_id", netid)
    .single();

  if (error || !user) {
    return null;
  }

  return user;
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
  adminClient?: SupabaseClient,
): Promise<{ records: T[]; errors: ProcessingError[] }> {
  const records: T[] = [];
  const errors: ProcessingError[] = [];

  // Optimization: Pre-fetch existing applicant IDs for this opening if duplicate check is enabled
  const existingApplicantIds = new Set<string>();
  if (tableName) {
    const { data: existingApps } = await supabase
      .from(tableName)
      .select("applicant_id")
      .eq("opening_id", openingId);

    if (existingApps) {
      existingApps.forEach((app: { applicant_id: string }) =>
        existingApplicantIds.add(app.applicant_id),
      );
    }
  }

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

    // Look up or create user
    let user = await lookupUserByNetId(
      supabase,
      row[CSV_RESERVED_COLUMNS.NETID],
    );

    // If user not found, create a placeholder user
    if (!user) {
      // Check if admin client is available
      if (!adminClient) {
        errors.push({
          row: rowNumber,
          netid: row[CSV_RESERVED_COLUMNS.NETID],
          error: `User not found and admin access is required to create new users.`,
        });
        if (!VALIDATION_CONFIG.skipInvalidRows) break;
        continue;
      }

      const email = `${row[CSV_RESERVED_COLUMNS.NETID]}@rice.edu`;
      // Use a dash as placeholder for name since it's required or preferred not to be null
      const name = "-";

      // 1. Create user in auth.users using admin client
      const { data: authUser, error: authError } =
        await adminClient.auth.admin.createUser({
          email: email,
          email_confirm: true, // Auto-confirm placeholder users
          user_metadata: {
            net_id: row[CSV_RESERVED_COLUMNS.NETID],
            name: name,
          },
        });

      if (authError || !authUser.user) {
        errors.push({
          row: rowNumber,
          netid: row[CSV_RESERVED_COLUMNS.NETID],
          error: `Failed to create auth user: ${authError?.message || "Unknown error"}`,
        });
        if (!VALIDATION_CONFIG.skipInvalidRows) break;
        continue;
      }

      // 2. Create or update user record in public.users
      // We use upsert here because a database trigger might have already created
      // the user record when the auth user was created.
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .upsert({
          id: authUser.user.id, // CRITICAL: Use the Auth User ID
          net_id: row[CSV_RESERVED_COLUMNS.NETID],
          name: name, // This is now explicitly '-'
          email: email,
        })
        .select("id, net_id")
        .single();

      if (createError || !newUser) {
        errors.push({
          row: rowNumber,
          netid: row[CSV_RESERVED_COLUMNS.NETID],
          error: `Failed to create public user: ${createError?.message || "Unknown error"}`,
        });
        if (!VALIDATION_CONFIG.skipInvalidRows) break;
        continue;
      }

      user = newUser;
    }

    // Check for duplicate application
    if (existingApplicantIds.has(user.id)) {
      errors.push({
        row: rowNumber,
        netid: row[CSV_RESERVED_COLUMNS.NETID],
        error: ERROR_MESSAGES.DUPLICATE_APPLICATION,
      });
      if (!VALIDATION_CONFIG.skipInvalidRows) break;
      continue;
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
