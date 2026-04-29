import { describe, it, expect } from "vitest";
import {
  CSV_RESERVED_COLUMNS,
  REQUIRED_CSV_COLUMNS,
  ERROR_MESSAGES,
  VALIDATION_CONFIG,
} from "@/lib/csv-upload-config";
import { ApplicationStatus, DEFAULT_APPLICATION_STATUS } from "@/types/app";

describe("ApplicationStatus", () => {
  it("values match the DB enum", () => {
    const validDbValues = [
      "No Status",
      "Applied",
      "Interviewing",
      "Offer",
      "Accepted Offer",
      "Rejected",
    ];
    for (const value of Object.values(ApplicationStatus)) {
      expect(validDbValues).toContain(value);
    }
  });
});

describe("DEFAULT_APPLICATION_STATUS", () => {
  it("is a valid application status", () => {
    expect(Object.values(ApplicationStatus)).toContain(
      DEFAULT_APPLICATION_STATUS,
    );
  });
});

describe("CSV_RESERVED_COLUMNS", () => {
  it("defines netid column", () => {
    expect(CSV_RESERVED_COLUMNS.NETID).toBe("netid");
  });
});

describe("REQUIRED_CSV_COLUMNS", () => {
  it("requires netid", () => {
    expect(REQUIRED_CSV_COLUMNS).toContain("netid");
  });
});

describe("ERROR_MESSAGES", () => {
  it("defines MISSING_NETID message", () => {
    expect(ERROR_MESSAGES.MISSING_NETID).toBeTruthy();
  });

  it("defines DUPLICATE_APPLICATION message", () => {
    expect(ERROR_MESSAGES.DUPLICATE_APPLICATION).toBeTruthy();
  });
});

describe("VALIDATION_CONFIG", () => {
  it("defines skipInvalidRows as boolean", () => {
    expect(typeof VALIDATION_CONFIG.skipInvalidRows).toBe("boolean");
  });
});
