import { describe, expect, it, vi } from "vitest";
import {
  buildApplicationRecord,
  ensureApplicant,
} from "@/lib/csv-upload-utils";
import { UNKNOWN_APPLICANT_NAME } from "@/lib/application-fields";
import { DEFAULT_APPLICATION_STATUS } from "@/types/app";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockSupabase(overrides: Record<string, unknown> = {}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    ...overrides,
  };

  return {
    from: vi.fn().mockReturnValue(chain),
    _chain: chain,
  } as unknown as SupabaseClient & { _chain: typeof chain };
}

// ---------------------------------------------------------------------------
// ensureApplicant
// ---------------------------------------------------------------------------

describe("ensureApplicant", () => {
  it("returns existing applicant when found with a real name", async () => {
    const existing = { id: "u1", net_id: "abc1", name: "Alice" };
    const supabase = makeMockSupabase();
    supabase._chain.maybeSingle.mockResolvedValue({
      data: existing,
      error: null,
    });

    const result = await ensureApplicant(supabase, "abc1", "Alice");
    expect(result).toEqual(existing);
    expect(supabase._chain.insert).not.toHaveBeenCalled();
    expect(supabase._chain.update).not.toHaveBeenCalled();
  });

  it("creates a new applicant when none exists", async () => {
    const created = { id: "u2", net_id: "xyz9", name: UNKNOWN_APPLICANT_NAME };
    const supabase = makeMockSupabase();
    supabase._chain.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });
    supabase._chain.single.mockResolvedValue({
      data: created,
      error: null,
    });

    const result = await ensureApplicant(
      supabase,
      "xyz9",
      UNKNOWN_APPLICANT_NAME,
    );
    expect(result).toEqual(created);
    expect(supabase._chain.insert).toHaveBeenCalledWith({
      net_id: "xyz9",
      name: UNKNOWN_APPLICANT_NAME,
    });
  });

  it("throws when insert fails", async () => {
    const supabase = makeMockSupabase();
    supabase._chain.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });
    supabase._chain.single.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    await expect(
      ensureApplicant(supabase, "xyz9", UNKNOWN_APPLICANT_NAME),
    ).rejects.toThrow("Failed to create applicant");
  });

  describe("name reconciliation", () => {
    it("upgrades sentinel name to real name when real name is provided", async () => {
      const existing = {
        id: "u3",
        net_id: "jdoe1",
        name: UNKNOWN_APPLICANT_NAME,
      };
      const updated = { id: "u3", net_id: "jdoe1", name: "Jane Doe" };
      const supabase = makeMockSupabase();
      supabase._chain.maybeSingle.mockResolvedValue({
        data: existing,
        error: null,
      });
      supabase._chain.single.mockResolvedValue({
        data: updated,
        error: null,
      });

      const result = await ensureApplicant(supabase, "jdoe1", "Jane Doe");
      expect(result).toEqual(updated);
      expect(supabase._chain.update).toHaveBeenCalledWith({
        name: "Jane Doe",
      });
    });

    it("does NOT upgrade when existing name is already real", async () => {
      const existing = { id: "u4", net_id: "jdoe1", name: "Jane Doe" };
      const supabase = makeMockSupabase();
      supabase._chain.maybeSingle.mockResolvedValue({
        data: existing,
        error: null,
      });

      const result = await ensureApplicant(supabase, "jdoe1", "Different Name");
      expect(result).toEqual(existing);
      expect(supabase._chain.update).not.toHaveBeenCalled();
    });

    it("does NOT upgrade when incoming name is also the sentinel", async () => {
      const existing = {
        id: "u5",
        net_id: "jdoe1",
        name: UNKNOWN_APPLICANT_NAME,
      };
      const supabase = makeMockSupabase();
      supabase._chain.maybeSingle.mockResolvedValue({
        data: existing,
        error: null,
      });

      const result = await ensureApplicant(
        supabase,
        "jdoe1",
        UNKNOWN_APPLICANT_NAME,
      );
      expect(result).toEqual(existing);
      expect(supabase._chain.update).not.toHaveBeenCalled();
    });

    it("throws when update fails", async () => {
      const existing = {
        id: "u6",
        net_id: "jdoe1",
        name: UNKNOWN_APPLICANT_NAME,
      };
      const supabase = makeMockSupabase();
      supabase._chain.maybeSingle.mockResolvedValue({
        data: existing,
        error: null,
      });
      supabase._chain.single.mockResolvedValue({
        data: null,
        error: { message: "update failed" },
      });

      await expect(
        ensureApplicant(supabase, "jdoe1", "Jane Doe"),
      ).rejects.toThrow("Failed to update applicant name");
    });
  });
});

// ---------------------------------------------------------------------------
// buildApplicationRecord
// ---------------------------------------------------------------------------

describe("buildApplicationRecord", () => {
  it("uses DEFAULT_APPLICATION_STATUS when no status provided", () => {
    const record = buildApplicationRecord("op1", "u1", {});
    expect(record.status).toBe(DEFAULT_APPLICATION_STATUS);
  });

  it("uses provided status when given", () => {
    const record = buildApplicationRecord("op1", "u1", {}, "Offer");
    expect(record.status).toBe("Offer");
  });

  it("includes opening_id, applicant_id, form_responses", () => {
    const formResponses = { major: "CS", gpa: "3.9" };
    const record = buildApplicationRecord("op1", "u1", formResponses);
    expect(record).toMatchObject({
      opening_id: "op1",
      applicant_id: "u1",
      form_responses: formResponses,
    });
  });
});

// ---------------------------------------------------------------------------
// UNKNOWN_APPLICANT_NAME constant
// ---------------------------------------------------------------------------

describe("UNKNOWN_APPLICANT_NAME", () => {
  it("is a non-empty string", () => {
    expect(typeof UNKNOWN_APPLICANT_NAME).toBe("string");
    expect(UNKNOWN_APPLICANT_NAME.length).toBeGreaterThan(0);
  });
});
