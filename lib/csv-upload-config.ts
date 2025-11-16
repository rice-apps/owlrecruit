/**
 * CSV Upload Configuration
 *
 * IMPORTANT: This file contains all the configurable settings for CSV uploads.
 * Modify these values to change behavior across the entire CSV upload system.
 */

// =============================================================================
// APPLICATION STATUS CONFIGURATION
// =============================================================================

/**
 * Define all possible application statuses and their display names.
 *
 * HOW TO MODIFY:
 * 1. Add/remove status values to match your database enum
 * 2. Update display names to change what users see
 * 3. The 'value' must match exactly what's in your database
 */
export const APPLICATION_STATUSES = {
  UPLOADED: {
    value: 'No Status',
    display: 'Uploaded Applications',
    description: 'Applications uploaded via CSV that need review'
  },
  APPLIED: {
    value: 'Applied',
    display: 'Applied',
    description: 'Applications that have been reviewed and approved'
  },
  INTERVIEWING: {
    value: 'Interviewing',
    display: 'Interviewing',
    description: 'Applicants currently in interview process'
  },
  OFFER: {
    value: 'Offer',
    display: 'Offer',
    description: 'Applicants who received an offer'
  },
  REJECTED: {
    value: 'Rejected',
    display: 'Rejected',
    description: 'Applications that were rejected'
  }
} as const;

/**
 * Default status for new CSV uploads.
 *
 * HOW TO CHANGE:
 * Set this to any status from APPLICATION_STATUSES above.
 * Example: DEFAULT_UPLOAD_STATUS = APPLICATION_STATUSES.UPLOADED.value
 */
export const DEFAULT_UPLOAD_STATUS = APPLICATION_STATUSES.APPLIED.value;

// =============================================================================
// CSV SCHEMA CONFIGURATION
// =============================================================================

/**
 * Required and reserved CSV column names.
 * These columns are handled specially and not stored in form_responses.
 *
 * HOW TO MODIFY:
 * - Add columns here if you want to map them to specific database fields
 * - Remove columns to treat them as regular form questions
 */
export const CSV_RESERVED_COLUMNS = {
  NETID: 'netid',           // Required: Used to lookup user
  RESUME: 'resume',         // Optional: URL to resume
  // Add more reserved columns here as needed
  // OPENING_ID: 'opening_id',  // Example: if you want this in CSV
} as const;

/**
 * Which columns are required in the CSV.
 *
 * HOW TO MODIFY:
 * Add/remove required columns by editing this array.
 */
export const REQUIRED_CSV_COLUMNS = [CSV_RESERVED_COLUMNS.NETID];

// =============================================================================
// DATABASE FIELD MAPPING
// =============================================================================

/**
 * Maps CSV data to database fields.
 *
 * HOW TO MODIFY:
 * 1. If you add a new column to the applications table, add it here
 * 2. If you want to store CSV data in a different field, change the value
 * 3. Set to null to exclude from database insert
 */
export const DATABASE_FIELD_MAPPING = {
  applications: {
    // Core fields (always included)
    org_id: 'org_id',
    opening_id: 'opening_id',
    applicant_id: 'applicant_id',
    status: 'status',

    // JSON storage field for dynamic questions
    form_responses: 'form_responses',

    // Optional fields - set to null if not in your schema
    position: null,           // Not used currently
    notes: null,              // Not used currently
    resume: null,             // Stored in form_responses instead
  },
  interviews: {
    // Core fields
    org_id: 'org_id',
    opening_id: 'opening_id',
    applicant_id: 'applicant_id',

    // JSON storage field for dynamic feedback
    feedback: 'feedback',
  }
} as const;

// =============================================================================
// KANBAN BOARD CONFIGURATION
// =============================================================================

/**
 * Define Kanban board columns.
 * Order matters - columns appear left to right.
 *
 * HOW TO MODIFY:
 * 1. Add/remove/reorder columns
 * 2. Change status values to match APPLICATION_STATUSES
 * 3. Update titles/descriptions as needed
 */
export const KANBAN_COLUMNS = [
  {
    id: 'nostatus',
    title: APPLICATION_STATUSES.UPLOADED.display,
    status: APPLICATION_STATUSES.UPLOADED.value,
  },
  {
    id: 'applied',
    title: APPLICATION_STATUSES.APPLIED.display,
    status: APPLICATION_STATUSES.APPLIED.value,
  },
  {
    id: 'interviewing',
    title: APPLICATION_STATUSES.INTERVIEWING.display,
    status: APPLICATION_STATUSES.INTERVIEWING.value,
  },
  {
    id: 'offer',
    title: APPLICATION_STATUSES.OFFER.display,
    status: APPLICATION_STATUSES.OFFER.value,
  },
  {
    id: 'rejected',
    title: APPLICATION_STATUSES.REJECTED.display,
    status: APPLICATION_STATUSES.REJECTED.value,
  },
];

/**
 * Number of columns for grid layout.
 * Should match the number of columns in KANBAN_COLUMNS.
 */
export const KANBAN_GRID_COLS = KANBAN_COLUMNS.length;

// =============================================================================
// ERROR HANDLING CONFIGURATION
// =============================================================================

/**
 * Error messages shown to users.
 *
 * HOW TO MODIFY:
 * Change these messages to customize user-facing error text.
 */
export const ERROR_MESSAGES = {
  MISSING_NETID: 'Missing required field: netid',
  USER_NOT_FOUND: 'User not found',
  OPENING_NOT_FOUND: 'Opening not found',
  INVALID_CONTENT_TYPE: 'Content-Type must be text/csv or text/plain',
  MISSING_OPENING_ID: 'X-Opening-Id header is required',
  NO_VALID_DATA: 'No valid data rows found in CSV',
  NO_VALID_RECORDS: 'No valid records to insert',
} as const;

// =============================================================================
// VALIDATION RULES
// =============================================================================

/**
 * Configure validation behavior.
 *
 * HOW TO MODIFY:
 * - Change skip behavior: true = skip invalid rows, false = fail entire upload
 * - Add custom validation rules by editing the validation utils
 */
export const VALIDATION_CONFIG = {
  skipInvalidRows: true,        // Continue processing if some rows fail
  validateEmail: false,          // Set true to validate email format
  validateResumeUrl: false,      // Set true to validate resume URLs
} as const;
