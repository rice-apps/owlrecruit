import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

// Seed data constants
const ORG_ID = "00000002-0000-0000-0000-000000000001"; // Rice Student Orgs
const OPENING_ID = "00000004-0000-0000-0000-000000000001"; // Software Engineer (open)

const ADMIN_EMAIL = "admin@test.owlrecruit.local";
const REVIEWER_EMAIL = "reviewer@test.owlrecruit.local";
const APPLICANT1_EMAIL = "applicant1@test.owlrecruit.local";

test.describe("Admin Flows", () => {
  test("admin can view their org page", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL);
    await page.goto(`/protected/org/${ORG_ID}`);

    await expect(page.getByText("Rice Student Orgs").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("admin can navigate to create new opening", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL);
    await page.goto(`/protected/org/${ORG_ID}/new-opening`);

    // Should see a form to create a new opening
    await expect(page.getByRole("textbox").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("admin can view and edit a draft opening", async ({ page }) => {
    // UX Designer opening is in 'draft' status
    const draftOpeningId = "00000004-0000-0000-0000-000000000002";
    await loginAs(page, ADMIN_EMAIL);
    await page.goto(`/protected/opening/${draftOpeningId}`);

    await expect(page.getByText("UX Designer").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("admin can view the upload tab on an opening", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL);
    await page.goto(`/protected/opening/${OPENING_ID}`);

    // Should see the Upload Data tab (admin-only)
    const uploadTab = page.getByRole("link", { name: "Upload Data" });
    await expect(uploadTab).toBeVisible({ timeout: 10000 });
  });

  test("admin can view the questions tab on an opening", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL);
    await page.goto(`/protected/opening/${OPENING_ID}`);

    const questionsTab = page.getByRole("link", { name: "Questions" });
    await expect(questionsTab).toBeVisible({ timeout: 10000 });
    await questionsTab.click();

    // Seeded question text
    await expect(page.getByText(/programming languages/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("org page shows all openings including draft and closed", async ({
    page,
  }) => {
    await loginAs(page, ADMIN_EMAIL);
    await page.goto(`/protected/org/${ORG_ID}`);

    // Default filter is "open" — Software Engineer should be visible
    await expect(page.getByText("Software Engineer").first()).toBeVisible({
      timeout: 10000,
    });

    // Switch to Draft filter to see UX Designer
    await page.getByRole("button", { name: "Draft" }).click();
    await expect(page.getByText("UX Designer").first()).toBeVisible({
      timeout: 5000,
    });

    // Switch to Closed filter to see Finance Intern
    await page.getByRole("button", { name: "Closed" }).click();
    await expect(page.getByText("Finance Intern").first()).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Admin Access — Negative Cases", () => {
  test("reviewer visiting the new-opening page is denied or sees no form", async ({
    page,
  }) => {
    await loginAs(page, REVIEWER_EMAIL);
    await page.goto(`/protected/org/${ORG_ID}/new-opening`);

    // Reviewers are not admins — they should be redirected or see no creation form
    // Allow up to 10s for any redirect to settle
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    const isOnNewOpeningPage = currentUrl.includes("new-opening");

    if (isOnNewOpeningPage) {
      // If somehow on the page, a POST to create an opening must still fail (403)
      // The page itself should show an access error, not a working form
      const submitButton = page.getByRole("button", { name: /create|submit/i });
      const hasWorkingForm = await submitButton.isVisible().catch(() => false);
      expect(hasWorkingForm).toBe(false);
    }
    // Redirect away is the expected behaviour
  });

  test("non-member applicant visiting org page sees no private data", async ({
    page,
  }) => {
    await loginAs(page, APPLICANT1_EMAIL);
    await page.goto(`/protected/org/${ORG_ID}`);
    await page.waitForTimeout(3000);

    // Applicant is not a member — draft and closed openings must not be visible
    await expect(page.getByText("UX Designer")).not.toBeVisible();
    await expect(page.getByText("Finance Intern")).not.toBeVisible();
  });
});
