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

interface ProcessingError {
  row: number;
  netid?: string;
  error: string;
}

interface OpeningLookupResult {
  org_id: string;
}

interface UserResult {
  id: string;
  net_id: string;
  name: string;
}

// =============================================================================
// VALIDATION
// =============================================================================

function validateRequiredFields(row: CSVRow): string | null {
  for (const col of REQUIRED_CSV_COLUMNS as readonly string[]) {
    if (!row[col]) return `Missing required field: ${col}`;
  }
  return null;
}

function validateNetId(netid: unknown): boolean {
  return !!netid && typeof netid === "string" && netid.trim().length > 0;
}

// =============================================================================
// DATA TRANSFORMATION
// =============================================================================

function extractFormResponses(row: CSVRow): Record<string, unknown> {
  const reserved = Object.values(CSV_RESERVED_COLUMNS) as string[];
  return Object.fromEntries(
    Object.entries(row).filter(([key]) => !reserved.includes(key)),
  );
}

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
    status: status ?? "Applied",
  };
}

// =============================================================================
// DATABASE LOOKUPS
// =============================================================================

async function lookupApplicantByNetId(
  supabase: SupabaseClient,
  netid: string,
): Promise<UserResult | null> {
  const { data, error } = await supabase
    .from("applicants")
    .select("id, net_id, name")
    .eq("net_id", netid)
    .maybeSingle();

  return error || !data ? null : data;
}

export async function ensureApplicant(
  supabase: SupabaseClient,
  netid: string,
  name: string,
): Promise<UserResult> {
  const existing = await lookupApplicantByNetId(supabase, netid);
  if (existing) {
    if (existing.name === "-" && name !== "-") {
      const { data, error } = await supabase
        .from("applicants")
        .update({ name })
        .eq("id", existing.id)
        .select()
        .single();
      if (!error && data) return data;
    }
    return existing;
  }

  const { data, error } = await supabase
    .from("applicants")
    .insert({ net_id: netid, name })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create applicant: ${error?.message}`);
  }
  return data;
}

export async function lookupOpening(
  supabase: SupabaseClient,
  openingId: string,
): Promise<OpeningLookupResult | null> {
  const { data, error } = await supabase
    .from("openings")
    .select("org_id")
    .eq("id", openingId)
    .single();

  return error || !data ? null : data;
}

// =============================================================================
// BATCH PROCESSING
// =============================================================================

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
): Promise<{ records: T[]; errors: ProcessingError[] }> {
  const records: T[] = [];
  const errors: ProcessingError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;

    const validationError = validateRequiredFields(row);
    if (validationError) {
      errors.push({ row: rowNumber, error: validationError });
      if (!VALIDATION_CONFIG.skipInvalidRows) break;
      continue;
    }

    if (!validateNetId(row[CSV_RESERVED_COLUMNS.NETID])) {
      errors.push({ row: rowNumber, error: ERROR_MESSAGES.MISSING_NETID });
      if (!VALIDATION_CONFIG.skipInvalidRows) break;
      continue;
    }

    const netid = row[CSV_RESERVED_COLUMNS.NETID] as string;
    let user = await lookupApplicantByNetId(supabase, netid);

    if (!user) {
      try {
        user = await ensureApplicant(supabase, netid, "-");
      } catch (err: unknown) {
        errors.push({
          row: rowNumber,
          netid,
          error: `Failed to create applicant: ${err instanceof Error ? err.message : String(err)}`,
        });
        if (!VALIDATION_CONFIG.skipInvalidRows) break;
        continue;
      }
    }

    records.push(
      buildRecordFn(
        orgId,
        openingId,
        user.id,
        extractFormResponses(row),
        defaultStatus,
      ),
    );
  }

  return { records, errors };
}

// =============================================================================
// RESPONSE FORMATTING
// =============================================================================

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

export function formatErrorResponse(message: string, details?: unknown) {
  return { error: message, details };
}
