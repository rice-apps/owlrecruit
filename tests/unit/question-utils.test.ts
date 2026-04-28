import { describe, it, expect } from "vitest";
import { parseQuestionText, encodeQuestionText } from "@/lib/question-utils";

describe("parseQuestionText", () => {
  it("parses a plain string as a text question", () => {
    const result = parseQuestionText("What is your major?");
    expect(result).toEqual({
      label: "What is your major?",
      type: "text",
      options: null,
    });
  });

  it("parses JSON-encoded form-builder question with type and options", () => {
    const encoded = JSON.stringify({
      label: "What is your availability?",
      type: "select",
      options: ["Full-time", "Part-time", "Internship"],
    });
    const result = parseQuestionText(encoded);
    expect(result.label).toBe("What is your availability?");
    expect(result.type).toBe("select");
    expect(result.options).toEqual(["Full-time", "Part-time", "Internship"]);
  });

  it("parses JSON-encoded textarea question", () => {
    const encoded = JSON.stringify({
      label: "Tell us about yourself.",
      type: "textarea",
      options: null,
    });
    const result = parseQuestionText(encoded);
    expect(result.type).toBe("textarea");
    expect(result.options).toBeNull();
  });

  it("falls back to text type when JSON has no label field", () => {
    const result = parseQuestionText('{"foo": "bar"}');
    expect(result.label).toBe('{"foo": "bar"}');
    expect(result.type).toBe("text");
  });

  it("handles malformed JSON gracefully", () => {
    const result = parseQuestionText("{not valid json");
    expect(result.label).toBe("{not valid json");
    expect(result.type).toBe("text");
  });
});

describe("encodeQuestionText", () => {
  it("returns plain string for simple text question with no options", () => {
    const result = encodeQuestionText("What is your major?", "text", null);
    expect(result).toBe("What is your major?");
  });

  it("encodes non-text type as JSON", () => {
    const result = encodeQuestionText(
      "Describe your experience.",
      "textarea",
      null,
    );
    const parsed = JSON.parse(result);
    expect(parsed.label).toBe("Describe your experience.");
    expect(parsed.type).toBe("textarea");
    expect(parsed.options).toBeNull();
  });

  it("encodes select question with options as JSON", () => {
    const result = encodeQuestionText("Grade", "select", [
      "Freshman",
      "Sophomore",
      "Junior",
      "Senior",
    ]);
    const parsed = JSON.parse(result);
    expect(parsed.label).toBe("Grade");
    expect(parsed.type).toBe("select");
    expect(parsed.options).toHaveLength(4);
  });

  it("encodes text question with options as JSON", () => {
    const result = encodeQuestionText("Preference", "text", [
      "Option A",
      "Option B",
    ]);
    const parsed = JSON.parse(result);
    expect(parsed.type).toBe("text");
    expect(parsed.options).toEqual(["Option A", "Option B"]);
  });

  it("round-trips: encode then parse returns original values", () => {
    const label = "Tell us about yourself.";
    const type = "textarea" as const;
    const options = null;
    const encoded = encodeQuestionText(label, type, options);
    const decoded = parseQuestionText(encoded);
    expect(decoded.label).toBe(label);
    expect(decoded.type).toBe(type);
    expect(decoded.options).toBe(options);
  });
});
