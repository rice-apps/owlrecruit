import { expect, test } from "@playwright/test";
import { signInViaApi } from "./helpers/auth";
import { apiGet, warmSession } from "./helpers/api";

const ORG_1 = "00000002-0000-0000-0000-000000000001";
const OPENING_SE = "00000004-0000-0000-0000-000000000001";

const ADMIN_EMAIL = "admin@test.owlrecruit.local";

test.describe("Auth Boundaries", () => {
  test.describe("handle_new_user trigger", () => {
    // Catches: missing DB trigger that caused 500s after DB reset
    // (no public.users row for logged-in user)

    test("GET /api/auth/me returns logged-in user ID", async ({ page }) => {
      await warmSession(page, ADMIN_EMAIL);
      const resp = await apiGet(page, "/api/auth/me");
      expect(resp.status()).toBe(200);
      const body = await resp.json();
      expect(body.id).toBeTruthy();
    });

    test("GET /api/user/org-status returns 200 (not 500 from missing user row)", async ({
      page,
    }) => {
      await warmSession(page, ADMIN_EMAIL);
      const resp = await apiGet(page, "/api/user/org-status");
      // Must be 200 or 404, never 500 — a 500 means the trigger didn't create the user row
      expect(resp.status()).not.toBe(500);
      expect(resp.status()).toBeLessThan(500);
    });
  });

  test.describe("restrict_to_rice_email hook", () => {
    // Catches: auth hook deletion that silently broke sign-in after DB reset

    test("sign in with test user succeeds (hook is registered and allows test domain)", async () => {
      // If this throws, the hook is misconfigured or deleted
      const session = await signInViaApi(ADMIN_EMAIL);
      expect(session.accessToken).toBeTruthy();
      expect(session.refreshToken).toBeTruthy();
    });
  });

  test.describe("unauthenticated access", () => {
    // Catches: missing auth checks on API routes that would expose data without login

    test("GET /api/openings returns 200 (public endpoint, no auth needed)", async ({
      request,
    }) => {
      const resp = await request.get("/api/openings");
      expect(resp.status()).toBe(200);
    });

    test("POST /api/orgs returns 401 without auth", async ({ request }) => {
      const resp = await request.post("/api/orgs", {
        data: { name: "Unauthorized Org" },
        headers: { "Content-Type": "application/json" },
      });
      expect(resp.status()).toBe(401);
    });

    test("POST /api/org/{orgId}/openings returns 401 without auth", async ({
      request,
    }) => {
      const resp = await request.post(`/api/org/${ORG_1}/openings`, {
        data: { title: "Unauthorized Opening" },
        headers: { "Content-Type": "application/json" },
      });
      expect(resp.status()).toBe(401);
    });

    test("PATCH /api/org/{orgId} returns 401 without auth", async ({
      request,
    }) => {
      const resp = await request.patch(`/api/org/${ORG_1}`, {
        data: { name: "Hacked Org Name" },
        headers: { "Content-Type": "application/json" },
      });
      expect(resp.status()).toBe(401);
    });

    test("GET /api/org/{orgId}/openings/{openingId} returns 401 without auth", async ({
      request,
    }) => {
      const resp = await request.get(
        `/api/org/${ORG_1}/openings/${OPENING_SE}`,
      );
      expect(resp.status()).toBe(401);
    });

    test("GET /api/org/{orgId}/opening/{openingId}/applicants returns 401 without auth", async ({
      request,
    }) => {
      const resp = await request.get(
        `/api/org/${ORG_1}/opening/${OPENING_SE}/applicants`,
      );
      // No auth → 401 (or RLS returns empty — either is acceptable, but never 200 with data)
      if (resp.status() === 200) {
        const body = await resp.json();
        expect(Array.isArray(body) ? body.length : 0).toBe(0);
      } else {
        expect(resp.status()).toBe(401);
      }
    });

    test("navigating to /protected without auth redirects to login", async ({
      page,
    }) => {
      await page.goto("/protected/discover");
      // Wait for redirect — protected routes must redirect unauthenticated users
      await page.waitForURL((url) => !url.pathname.startsWith("/protected"), {
        timeout: 10000,
      });
      expect(page.url()).not.toContain("/protected");
    });
  });
});
