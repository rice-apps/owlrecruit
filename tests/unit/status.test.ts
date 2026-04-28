import { describe, it, expect } from "vitest";
import {
  getApplicationStatusColor,
  getOpeningStatusColor,
  getOpeningStatusLabel,
  APPLICATION_STATUS_LIST,
  TERMINAL_STATUSES,
} from "@/lib/status";

describe("getApplicationStatusColor", () => {
  it("returns blue for Applied", () => {
    expect(getApplicationStatusColor("Applied")).toBe("blue");
  });

  it("returns orange for Interviewing", () => {
    expect(getApplicationStatusColor("Interviewing")).toBe("orange");
  });

  it("returns violet for Offer", () => {
    expect(getApplicationStatusColor("Offer")).toBe("violet");
  });

  it("returns green for Accepted Offer", () => {
    expect(getApplicationStatusColor("Accepted Offer")).toBe("green");
  });

  it("returns red for Rejected", () => {
    expect(getApplicationStatusColor("Rejected")).toBe("red");
  });

  it("returns gray for No Status (default)", () => {
    expect(getApplicationStatusColor("No Status")).toBe("gray");
  });

  it("returns gray for unknown status", () => {
    expect(getApplicationStatusColor("Unknown")).toBe("gray");
  });
});

describe("getOpeningStatusColor", () => {
  it("returns green for open", () => {
    expect(getOpeningStatusColor("open")).toBe("green");
  });

  it("returns red for closed", () => {
    expect(getOpeningStatusColor("closed")).toBe("red");
  });

  it("returns gray for draft", () => {
    expect(getOpeningStatusColor("draft")).toBe("gray");
  });
});

describe("getOpeningStatusLabel", () => {
  it("capitalizes open -> Open", () => {
    expect(getOpeningStatusLabel("open")).toBe("Open");
  });

  it("capitalizes closed -> Closed", () => {
    expect(getOpeningStatusLabel("closed")).toBe("Closed");
  });

  it("capitalizes draft -> Draft", () => {
    expect(getOpeningStatusLabel("draft")).toBe("Draft");
  });

  it("returns raw value for unknown status", () => {
    expect(getOpeningStatusLabel("unknown_status")).toBe("unknown_status");
  });
});

describe("APPLICATION_STATUS_LIST", () => {
  it("contains all 6 expected statuses", () => {
    expect(APPLICATION_STATUS_LIST).toHaveLength(6);
    expect(APPLICATION_STATUS_LIST).toContain("No Status");
    expect(APPLICATION_STATUS_LIST).toContain("Applied");
    expect(APPLICATION_STATUS_LIST).toContain("Interviewing");
    expect(APPLICATION_STATUS_LIST).toContain("Offer");
    expect(APPLICATION_STATUS_LIST).toContain("Accepted Offer");
    expect(APPLICATION_STATUS_LIST).toContain("Rejected");
  });
});

describe("TERMINAL_STATUSES", () => {
  it("marks Accepted Offer as terminal", () => {
    expect(TERMINAL_STATUSES.has("Accepted Offer")).toBe(true);
  });

  it("marks Rejected as terminal", () => {
    expect(TERMINAL_STATUSES.has("Rejected")).toBe(true);
  });

  it("does not mark Interviewing as terminal", () => {
    expect(TERMINAL_STATUSES.has("Interviewing")).toBe(false);
  });
});
