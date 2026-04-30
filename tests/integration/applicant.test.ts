import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

// Seed data constants (from supabase/seed/)
const OPENING_ID = "00000004-0000-0000-0000-000000000001"; // Software Engineer (open)
const OPENING_ML = "00000004-0000-0000-0000-000000000005"; // Marketing Lead (open, ORG_2)
const OPENING_DOT_LABELS = "00000004-0000-0000-0000-000000000006"; // Research Assistant (dot-labeled questions)
const APPLICANT_EMAIL = "applicant1@test.owlrecruit.local";
const APPLICANT2_EMAIL = "applicant2@test.owlrecruit.local";
const APPLICANT3_EMAIL = "applicant3@rice.edu"; // rice.edu user — needed to reach the apply form

test.describe("Applicant Flows", () => {
  test("can browse open openings on the discover page", async ({ page }) => {
    await loginAs(page, APPLICANT_EMAIL);
    await page.goto("/protected/discover");

    // Seeded "Software Engineer" opening should appear
    await expect(page.getByText("Software Engineer").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("can navigate to an opening detail page", async ({ page }) => {
    await loginAs(page, APPLICANT_EMAIL);
    await page.goto(`/protected/opening/${OPENING_ID}`);

    await expect(page.getByText("Software Engineer").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Rice Student Orgs").first()).toBeVisible();
  });

  test("already-applied state is shown for applicant who applied", async ({
    page,
  }) => {
    // alice (applicant1) already has an application in the seed data
    await loginAs(page, APPLICANT_EMAIL);
    await page.goto(`/apply/${OPENING_ID}`);

    // Should show an "already applied" notice rather than the apply form
    await expect(
      page.getByText(/already applied|already submitted/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test("can see own applications on My Applications page", async ({ page }) => {
    await loginAs(page, APPLICANT_EMAIL);
    await page.goto("/protected/applications");

    // alice applied to Software Engineer and Event Coordinator in seed data
    await expect(
      page.getByText(/Software Engineer|Event Coordinator/).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("My Applications page shows correct status badges", async ({ page }) => {
    await loginAs(page, APPLICANT_EMAIL);
    await page.goto("/protected/applications");

    // Switch to Inactive tab — alice's SE app has 'Accepted Offer' which is inactive
    await page.getByRole("button", { name: "Inactive" }).click();
    await expect(page.getByText("Accepted Offer")).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Applicant Visibility — Negative Cases", () => {
  test("draft openings do NOT appear on /protected/discover", async ({
    page,
  }) => {
    await loginAs(page, APPLICANT_EMAIL);
    await page.goto("/protected/discover");
    await page.waitForTimeout(3000);

    // UX Designer is in draft status — must not be visible to non-members
    await expect(page.getByText("UX Designer")).not.toBeVisible();
  });

  test("closed openings do NOT appear on /protected/discover", async ({
    page,
  }) => {
    await loginAs(page, APPLICANT_EMAIL);
    await page.goto("/protected/discover");
    await page.waitForTimeout(3000);

    // Finance Intern is closed — must not be visible
    await expect(page.getByText("Finance Intern")).not.toBeVisible();
  });

  test("applicant cannot see other applicants on the opening page", async ({
    page,
  }) => {
    // alice can view the opening overview, but NOT the applicants list
    await loginAs(page, APPLICANT_EMAIL);
    await page.goto(`/protected/opening/${OPENING_ID}`);
    await page.waitForTimeout(3000);

    // The applicants tab should not be present for non-members
    const applicantsTab = page.getByRole("link", { name: "Applicants" });
    await expect(applicantsTab).not.toBeVisible();
  });
});

test.describe("Apply form with dot-labeled questions", () => {
  test("can type into dot-labeled fields without crashing", async ({
    page,
  }) => {
    await loginAs(page, APPLICANT3_EMAIL);
    await page.goto(`/apply/${OPENING_DOT_LABELS}`);

    const textarea = page.getByRole("textbox").first();
    await expect(textarea).toBeVisible({ timeout: 10000 });
    await textarea.fill("I am interested in research.");

    await expect(page.getByRole("alert")).not.toBeVisible();
  });

  test("can submit an application with dot-labeled questions", async ({
    page,
  }) => {
    await loginAs(page, APPLICANT3_EMAIL);
    await page.goto(`/apply/${OPENING_DOT_LABELS}`);

    await page
      .getByRole("textbox")
      .first()
      .fill("I am interested in research.");

    await page.getByRole("button", { name: /submit/i }).click();

    await expect(page.getByText(/application submitted/i)).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("CSV-uploaded applicant already-applied detection", () => {
  // Catches: already-applied check using user_id instead of applicant_id,
  // which misses applications that were CSV-uploaded (user_id is NULL).
  // bob001 has a seeded CSV application to Marketing Lead with no user_id.

  test("applicant2 sees already-applied for their CSV-uploaded application", async ({
    page,
  }) => {
    await loginAs(page, APPLICANT2_EMAIL);
    await page.goto(`/apply/${OPENING_ML}`);

    // bob001's net_id must be resolved via the applicants table, not user_id
    await expect(
      page.getByText(/already applied|already submitted/i),
    ).toBeVisible({ timeout: 10000 });
  });
});
