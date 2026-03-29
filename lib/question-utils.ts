/**
 * Utilities for encoding/decoding question metadata in the question_text column.
 *
 * Since the DB schema has no field_type or options columns, we encode rich
 * question metadata as JSON inside question_text. Plain-string question_text
 * values (from CSV uploads) are handled transparently via the parser.
 *
 * Format for form-builder questions:
 *   {"label":"Tell us about yourself","type":"textarea","options":null}
 *
 * The `label` value is used as the key in form_responses (matching the
 * CSV-upload convention where question_text IS the form_responses key).
 */

export type FieldType = "text" | "textarea" | "select" | "checkbox" | "url";

export interface ParsedQuestion {
  label: string;
  type: FieldType;
  options: string[] | null;
}

/**
 * Parses a question_text value, handling both plain strings and JSON-encoded
 * form-builder questions.
 */
export function parseQuestionText(text: string): ParsedQuestion {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.label === "string") {
      return {
        label: parsed.label,
        type: (parsed.type as FieldType) || "text",
        options: Array.isArray(parsed.options) ? parsed.options : null,
      };
    }
  } catch {
    // Not JSON — treat as plain text (CSV-uploaded question)
  }
  return { label: text, type: "text", options: null };
}

/**
 * Encodes a form-builder question as a question_text string.
 * Simple text questions with no options are stored as plain strings for
 * backwards compatibility.
 */
export function encodeQuestionText(
  label: string,
  type: FieldType,
  options: string[] | null,
): string {
  if (type === "text" && !options) return label;
  return JSON.stringify({ label, type, options: options ?? null });
}
