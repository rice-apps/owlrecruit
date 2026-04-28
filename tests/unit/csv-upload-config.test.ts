import { describe, it, expect } from "vitest";
import {
  APPLICATION_STATUSES,
  DEFAULT_UPLOAD_STATUS,
  CSV_RESERVED_COLUMNS,
  REQUIRED_CSV_COLUMNS,
  KANBAN_COLUMNS,
  ERROR_MESSAGES,
  VALIDATION_CONFIG,
} from "@/lib/csv-upload-config";

describe("APPLICATION_STATUSES", () => {
  it("each status has a value and display", () => {
    for (const entry of Object.values(APPLICATION_STATUSES)) {
      expect(entry.value).toBeTruthy();
      expect(entry.display).toBeTruthy();
    }
  });

  it("status values match the DB enum", () => {
    const validDbValues = [
      "No Status",
      "Applied",
      "Interviewing",
      "Offer",
      "Accepted Offer",
      "Rejected",
    ];
    for (const entry of Object.values(APPLICATION_STATUSES)) {
      expect(validDbValues).toContain(entry.value);
    }
  });
});

describe("DEFAULT_UPLOAD_STATUS", () => {
  it("is a valid application status value", () => {
    const validValues = Object.values(APPLICATION_STATUSES).map((s) => s.value);
    expect(validValues).toContain(DEFAULT_UPLOAD_STATUS);
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

describe("KANBAN_COLUMNS", () => {
  it("has at least one column", () => {
    expect(KANBAN_COLUMNS.length).toBeGreaterThan(0);
  });

  it("each column has id, title, and status", () => {
    for (const col of KANBAN_COLUMNS) {
      expect(col.id).toBeTruthy();
      expect(col.title).toBeTruthy();
      expect(col.status).toBeTruthy();
    }
  });

  it("all column statuses match known APPLICATION_STATUSES values", () => {
    const validValues = Object.values(APPLICATION_STATUSES).map((s) => s.value);
    for (const col of KANBAN_COLUMNS) {
      expect(validValues).toContain(col.status);
    }
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
