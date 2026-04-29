/**
 * Access Control Tests
 *
 * Verifies the full access control matrix:
 * - Cross-org isolation: users cannot access data from orgs they don't belong to
 * - Role-based access: reviewers cannot perform admin-only actions
 * - Application privacy: applicants only see their own data
 * - Opening visibility: draft/closed openings hidden from non-members
 */
import { test, expect } from "@playwright/test";
import { warmSession, apiGet, apiPost, apiPatch } from "./helpers/api";

const ORG_1 = "00000002-0000-0000-0000-000000000001"; // Rice Student Orgs
const ORG_2 = "00000002-0000-0000-0000-000000000002"; // HackRice Planning

const OPENING_SE = "00000004-0000-0000-0000-000000000001"; // SE (open, ORG_1)
const OPENING_UX = "00000004-0000-0000-0000-000000000002"; // UX Designer (draft, ORG_1)
const OPENING_FI = "00000004-0000-0000-0000-000000000003"; // Finance Intern (closed, ORG_1)
const OPENING_EC = "00000004-0000-0000-0000-000000000004"; // Event Coordinator (open, ORG_2)

const APP_ALICE_SE = "00000005-1000-0000-0000-000000000001"; // Alice's SE application

const REVIEWER_EMAIL = "reviewer@test.owlrecruit.local";
const APPLICANT1_EMAIL = "applicant1@test.owlrecruit.local";
const APPLICANT2_EMAIL = "applicant2@test.owlrecruit.local";

test.describe("Access Control", () => {
  test.describe("Reviewer — cannot perform admin actions in own org", () => {
    test("POST /api/org/{orgId}/openings returns 403", async ({ page }) => {
      await warmSession(page, REVIEWER_EMAIL);
      const resp = await apiPost(page, `/api/org/${ORG_1}/openings`, {
        title: "Reviewer Created Opening",
        status: "open",
      });
      expect(resp.status()).toBe(403);
    });

    test("PATCH /api/org/{orgId}/openings/{openingId} returns 403", async ({
      page,
    }) => {
      await warmSession(page, REVIEWER_EMAIL);
      const resp = await apiPatch(
        page,
        `/api/org/${ORG_1}/openings/${OPENING_SE}`,
        { title: "Tampered Title" },
      );
      expect(resp.status()).toBe(403);
    });

    test("PATCH /api/org/{orgId} (org settings) returns 403", async ({
      page,
    }) => {
      await warmSession(page, REVIEWER_EMAIL);
      const resp = await apiPatch(page, `/api/org/${ORG_1}`, {
        name: "Reviewer Renamed Org",
      });
      expect(resp.status()).toBe(403);
    });

    test("POST /api/org/{orgId}/members returns 403", async ({ page }) => {
      await warmSession(page, REVIEWER_EMAIL);
      const resp = await apiPost(page, `/api/org/${ORG_1}/members`, {
        userId: "00000001-0000-0000-0000-000000000004",
        role: "reviewer",
      });
      expect(resp.status()).toBe(403);
    });
  });

  test.describe("Reviewer — cross-org isolation (ORG_1 reviewer vs ORG_2)", () => {
    test("POST /api/org/{ORG_2}/openings returns 403", async ({ page }) => {
      await warmSession(page, REVIEWER_EMAIL);
      const resp = await apiPost(page, `/api/org/${ORG_2}/openings`, {
        title: "Cross-Org Attack",
        status: "open",
      });
      expect(resp.status()).toBe(403);
    });

    test("PATCH /api/org/{ORG_2}/openings/{openingId} returns 403", async ({
      page,
    }) => {
      await warmSession(page, REVIEWER_EMAIL);
      const resp = await apiPatch(
        page,
        `/api/org/${ORG_2}/openings/${OPENING_EC}`,
        { title: "Tampered" },
      );
      expect(resp.status()).toBe(403);
    });

    test("GET /api/org/{ORG_2}/opening/{openingId}/applicants returns empty or 403", async ({
      page,
    }) => {
      await warmSession(page, REVIEWER_EMAIL);
      const resp = await apiGet(
        page,
        `/api/org/${ORG_2}/opening/${OPENING_EC}/applicants`,
      );
      if (resp.status() === 200) {
        const body = await resp.json();
        // RLS should filter out all rows — reviewer has no membership in ORG_2
        expect(Array.isArray(body) ? body.length : 0).toBe(0);
      } else {
        expect(resp.status()).toBe(403);
      }
    });
  });

  test.describe("Reviewer — can access what they are allowed", () => {
    test("GET /api/org/{orgId}/openings returns 200 with openings", async ({
      page,
    }) => {
      await warmSession(page, REVIEWER_EMAIL);
      const resp = await apiGet(page, `/api/org/${ORG_1}/openings`);
      expect(resp.status()).toBe(200);
      const body = await resp.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });

    test("GET /api/org/{orgId}/opening/{openingId}/applicants returns 200 with applicants", async ({
      page,
    }) => {
      await warmSession(page, REVIEWER_EMAIL);
      const resp = await apiGet(
        page,
        `/api/org/${ORG_1}/opening/${OPENING_SE}/applicants`,
      );
      expect(resp.status()).toBe(200);
      const body = await resp.json();
      const applicants = body.applicants ?? body;
      expect(Array.isArray(applicants)).toBe(true);
      expect(applicants.length).toBeGreaterThan(0);
    });

    test("GET reviews for an application returns 200", async ({ page }) => {
      await warmSession(page, REVIEWER_EMAIL);
      const resp = await apiGet(
        page,
        `/api/org/${ORG_1}/applications/${APP_ALICE_SE}/reviews`,
      );
      expect(resp.status()).toBe(200);
    });
  });

  test.describe("Applicant — cannot access org-internal data", () => {
    test("GET /api/org/{orgId}/openings returns 403 or empty (not a member)", async ({
      page,
    }) => {
      await warmSession(page, APPLICANT1_EMAIL);
      const resp = await apiGet(page, `/api/org/${ORG_1}/openings`);
      if (resp.status() === 200) {
        const body = await resp.json();
        expect(Array.isArray(body) ? body.length : 0).toBe(0);
      } else {
        expect(resp.status()).toBeGreaterThanOrEqual(400);
      }
    });

    test("GET /api/org/{orgId}/opening/{openingId}/applicants returns empty or 403", async ({
      page,
    }) => {
      await warmSession(page, APPLICANT1_EMAIL);
      const resp = await apiGet(
        page,
        `/api/org/${ORG_1}/opening/${OPENING_SE}/applicants`,
      );
      if (resp.status() === 200) {
        const body = await resp.json();
        expect(Array.isArray(body) ? body.length : 0).toBe(0);
      } else {
        expect(resp.status()).toBeGreaterThanOrEqual(400);
      }
    });

    test("GET reviews for an application returns empty or 403 for non-member", async ({
      page,
    }) => {
      await warmSession(page, APPLICANT1_EMAIL);
      const resp = await apiGet(
        page,
        `/api/org/${ORG_1}/applications/${APP_ALICE_SE}/reviews`,
      );
      if (resp.status() === 200) {
        const body = await resp.json();
        // If it returns data, comments and scores should be empty (RLS blocks)
        const hasPrivateData =
          (body.comments?.length ?? 0) > 0 ||
          (body.summary?.reviewerScores?.length ?? 0) > 0;
        expect(hasPrivateData).toBe(false);
      } else {
        expect(resp.status()).toBeGreaterThanOrEqual(400);
      }
    });
  });

  test.describe("Application data privacy", () => {
    test("GET /api/user/applications only returns own applications", async ({
      page,
    }) => {
      // applicant2 (bob) should see only their own applications
      await warmSession(page, APPLICANT2_EMAIL);
      const resp = await apiGet(page, "/api/user/applications");
      expect(resp.status()).toBe(200);
      const apps = await resp.json();
      if (Array.isArray(apps) && apps.length > 0) {
        // None of the applications should belong to alice (applicant1)
        // alice's application IDs start with 00000005-1000-0000-0000-00000000000{1,4,6}
        const aliceAppIds = [
          "00000005-1000-0000-0000-000000000001",
          "00000005-1000-0000-0000-000000000004",
          "00000005-1000-0000-0000-000000000006",
        ];
        for (const app of apps) {
          expect(aliceAppIds).not.toContain(app.id);
        }
      }
    });
  });

  test.describe("Opening visibility — public list only shows open openings", () => {
    // Catches: draft/closed openings leaking into the public discover feed

    test("GET /api/openings does not include draft openings", async ({
      request,
    }) => {
      const resp = await request.get("/api/openings");
      expect(resp.status()).toBe(200);
      const { data: openings } = await resp.json();
      const ids = openings.map((o: { id: string }) => o.id);
      expect(ids).not.toContain(OPENING_UX); // UX Designer is draft
    });

    test("GET /api/openings does not include closed openings", async ({
      request,
    }) => {
      const resp = await request.get("/api/openings");
      expect(resp.status()).toBe(200);
      const { data: openings } = await resp.json();
      const ids = openings.map((o: { id: string }) => o.id);
      expect(ids).not.toContain(OPENING_FI); // Finance Intern is closed
    });

    test("GET /api/openings includes open openings", async ({ page }) => {
      // Authenticate so RLS allows reading openings
      await warmSession(page, APPLICANT1_EMAIL);
      const resp = await apiGet(page, "/api/openings");
      expect(resp.status()).toBe(200);
      const { data: openings } = await resp.json();
      const ids = openings.map((o: { id: string }) => o.id);
      expect(ids).toContain(OPENING_SE); // Software Engineer is open
    });
  });
});
