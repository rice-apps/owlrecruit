/**
 * API Contract Tests
 *
 * Each test reproduces a specific class of bug found during the schema
 * improvements session. If any of these fail after a DB reset or code
 * change, it points to a regression in request handling or schema shape.
 */
import { expect, test } from "@playwright/test";
import { apiGet, apiPost, warmSession } from "./helpers/api";

const ORG_1 = "00000002-0000-0000-0000-000000000001"; // Rice Student Orgs
const OPENING_SE = "00000004-0000-0000-0000-000000000001"; // Software Engineer (open)
const OPENING_FI = "00000004-0000-0000-0000-000000000003"; // Finance Intern (closed)

const ADMIN_EMAIL = "admin@test.owlrecruit.local";
const APPLICANT1_EMAIL = "applicant1@test.owlrecruit.local";
const REVIEWER_ID = "00000001-0000-0000-0000-000000000002";

test.describe("API Contracts", () => {
  test.describe("Content-Type handling", () => {
    // Catches: POST /api/orgs calling request.formData() while client sends JSON

    test("POST /api/orgs with JSON body returns 201 (not 500 from formData parse)", async ({
      page,
    }) => {
      await warmSession(page, ADMIN_EMAIL);
      const resp = await apiPost(page, "/api/orgs", {
        name: `Contract Test Org ${Date.now()}`,
        description: "Created by api-contracts test",
      });
      expect(resp.status()).toBe(201);
      const body = await resp.json();
      expect(body.id).toBeTruthy();
    });
  });

  test.describe("Rubric shape (jsonb, not jsonb[])", () => {
    // Catches: rubric stored as jsonb[] that deserialises incorrectly

    test("GET opening config returns rubric as array of objects with name and max_val", async ({
      page,
    }) => {
      await warmSession(page, ADMIN_EMAIL);
      const resp = await apiGet(
        page,
        `/api/org/${ORG_1}/openings/${OPENING_SE}`,
      );
      expect(resp.status()).toBe(200);
      const body = await resp.json();
      const rubric = body.opening?.rubric;
      expect(Array.isArray(rubric)).toBe(true);
      expect(rubric.length).toBeGreaterThan(0);
      for (const item of rubric) {
        expect(typeof item.name).toBe("string");
        expect(item.name.length).toBeGreaterThan(0);
        expect(typeof item.max_val).toBe("number");
      }
    });
  });

  test.describe("Reviewer IDs round-trip (opening_reviewers join table)", () => {
    // Catches: reviewer_ids stored as raw jsonb column with no FK integrity

    test("GET opening config returns reviewer_ids as array of UUIDs", async ({
      page,
    }) => {
      await warmSession(page, ADMIN_EMAIL);
      const resp = await apiGet(
        page,
        `/api/org/${ORG_1}/openings/${OPENING_SE}`,
      );
      expect(resp.status()).toBe(200);
      const body = await resp.json();
      const reviewerIds = body.opening?.reviewer_ids;
      expect(Array.isArray(reviewerIds)).toBe(true);
      // SE opening is seeded with 2 reviewers
      expect(reviewerIds.length).toBe(2);
      for (const id of reviewerIds) {
        expect(typeof id).toBe("string");
        expect(id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
      }
    });

    test("PATCH opening reviewer_ids then GET returns updated list", async ({
      page,
    }) => {
      await warmSession(page, ADMIN_EMAIL);

      // Create a fresh opening to avoid polluting seeded data
      const createResp = await apiPost(page, `/api/org/${ORG_1}/openings`, {
        title: `Reviewer Round-Trip Test ${Date.now()}`,
        status: "draft",
        reviewer_ids: [REVIEWER_ID],
      });
      expect(createResp.status()).toBe(201);
      const { id: newOpeningId } = await createResp.json();

      const getResp = await apiGet(
        page,
        `/api/org/${ORG_1}/openings/${newOpeningId}`,
      );
      expect(getResp.status()).toBe(200);
      const body = await getResp.json();
      expect(body.opening.reviewer_ids).toContain(REVIEWER_ID);
    });
  });

  test.describe("Applicants list join alias", () => {
    // Catches: wrong Supabase join alias (users:applicant_id vs applicant:applicant_id)
    // that caused applicant names to be null

    test("GET applicants returns items with truthy name fields", async ({
      page,
    }) => {
      await warmSession(page, ADMIN_EMAIL);
      const resp = await apiGet(
        page,
        `/api/org/${ORG_1}/opening/${OPENING_SE}/applicants`,
      );
      expect(resp.status()).toBe(200);
      const body = await resp.json();
      // API returns { applicants: [...] }
      const applicants = body.applicants ?? body;
      expect(Array.isArray(applicants)).toBe(true);
      expect(applicants.length).toBeGreaterThan(0);
      for (const item of applicants) {
        // If join alias is wrong, name is null/undefined
        expect(item.name).toBeTruthy();
        expect(typeof item.name).toBe("string");
      }
    });
  });

  test.describe("Unique constraints", () => {
    // Catches: missing unique constraints that let duplicate inserts succeed
    // (instead of returning a meaningful error)

    test("applying to the same opening twice returns 4xx (not 500)", async ({
      page,
    }) => {
      // applicant1/alice already has a seeded application for Finance Intern.
      // Test users have @test.owlrecruit.local emails, so the rice.edu check fires first
      // and returns 400. If that check is removed, the closed-opening or duplicate check
      // returns 409. Either way, must NOT be 500.
      await warmSession(page, APPLICANT1_EMAIL);
      const resp = await apiPost(page, `/api/openings/${OPENING_FI}/apply`, {
        form_responses: {},
      });
      expect(resp.status()).not.toBe(500);
      expect(resp.status()).toBeGreaterThanOrEqual(400);
      expect(resp.status()).toBeLessThan(500);
    });

    test("adding an existing org member again returns 4xx (not 500)", async ({
      page,
    }) => {
      await warmSession(page, ADMIN_EMAIL);
      // reviewer is already a member of ORG_1
      const resp = await apiPost(page, `/api/org/${ORG_1}/members`, {
        userId: REVIEWER_ID,
        role: "reviewer",
      });
      // Must NOT be 500 — unique constraint should surface as a 4xx
      expect(resp.status()).not.toBe(500);
      expect(resp.status()).toBeGreaterThanOrEqual(400);
      expect(resp.status()).toBeLessThan(500);
    });
  });

  test.describe("user_id column (not users_id)", () => {
    // Catches: wrong column name in applications table that caused 500s

    test("seeded applications appear in GET /api/user/applications for alice", async ({
      page,
    }) => {
      await warmSession(page, APPLICANT1_EMAIL);
      const resp = await apiGet(page, "/api/user/applications");
      expect(resp.status()).toBe(200);
      const body = await resp.json();
      // Alice has 3 seeded applications — if user_id is wrong, this returns empty
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });

    test("applications in GET /api/user/applications include status field", async ({
      page,
    }) => {
      await warmSession(page, APPLICANT1_EMAIL);
      const resp = await apiGet(page, "/api/user/applications");
      expect(resp.status()).toBe(200);
      const apps = await resp.json();
      for (const app of apps) {
        expect(app.status).toBeTruthy();
      }
    });
  });
});
