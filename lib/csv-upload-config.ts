export const CSV_RESERVED_COLUMNS = {
  NETID: "netid",
  RESUME: "resume",
} as const;

export const REQUIRED_CSV_COLUMNS = [CSV_RESERVED_COLUMNS.NETID] as const;

export const ERROR_MESSAGES = {
  MISSING_NETID: "Missing required field: netid",
  USER_NOT_FOUND: "User not found",
  OPENING_NOT_FOUND: "Opening not found",
  INVALID_CONTENT_TYPE: "Content-Type must be text/csv or text/plain",
  MISSING_OPENING_ID: "X-Opening-Id header is required",
  NO_VALID_DATA: "No valid data rows found in CSV",
  NO_VALID_RECORDS: "No valid records to insert",
  DUPLICATE_APPLICATION: "Application already exists for this user",
} as const;

export const VALIDATION_CONFIG = {
  skipInvalidRows: true,
} as const;
