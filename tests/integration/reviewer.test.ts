import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

// Seed data constants
const ORG_ID = "00000002-0000-0000-0000-000000000001"; // Rice Student Orgs
const OPENING_ID = "00000004-0000-0000-0000-000000000001"; // Software Engineer (open)
const APPLICATION_ID = "00000005-1000-0000-0000-000000000001"; // Alice's SE application

const REVIEWER_EMAIL = "reviewer@test.owlrecruit.local";
const ADMIN_EMAIL = "admin@test.owlrecruit.local";

test.describe("Reviewer Flows", () => {
  test("reviewer can view their assigned org", async ({ page }) => {
    await loginAs(page, REVIEWER_EMAIL);
    await page.goto(`/protected/org/${ORG_ID}`);

    await expect(page.getByText("Rice Student Orgs").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("reviewer can see the openings list for their org", async ({ page }) => {
    await loginAs(page, REVIEWER_EMAIL);
    await page.goto(`/protected/org/${ORG_ID}`);

    await expect(page.getByText("Software Engineer").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("reviewer can navigate to an opening and see applicants", async ({
    page,
  }) => {
    await loginAs(page, REVIEWER_EMAIL);
    // Navigate directly to the applicants tab
    await page.goto(`/protected/opening/${OPENING_ID}?tab=applicants`);

    // Seeded applicants: Alice (Accepted Offer), Bob (Interviewing), Charlie (No Status)
    await expect(page.getByText("Alice Applicant")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Bob Applicant")).toBeVisible();
  });

  test("reviewer can view an applicant submission detail page", async ({
    page,
  }) => {
    await loginAs(page, REVIEWER_EMAIL);
    await page.goto(`/protected/application/${APPLICATION_ID}`);

    // Should see the applicant name and some form response content
    await expect(page.getByText("Alice Applicant").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("reviewer can see existing comments on an application", async ({
    page,
  }) => {
    await loginAs(page, REVIEWER_EMAIL);
    await page.goto(`/protected/application/${APPLICATION_ID}`);

    // Wait for page data to load (ensures orgId is set before mounting CommentsPanel)
    await expect(page.getByText("Alice Applicant").first()).toBeVisible({
      timeout: 10000,
    });

    // Switch to Comments tab in the sidebar (default is Skills)
    await page.getByTitle("Comments").click();

    // Seeded comment by reviewer: "Strong technical background..."
    await expect(
      page.getByText(/Strong technical background/).first(),
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test("admin can view the org page and see members", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL);
    await page.goto(`/protected/org/${ORG_ID}`);

    await expect(page.getByText("Rice Student Orgs").first()).toBeVisible({
      timeout: 10000,
    });
    // Admin should see org member list
    await expect(
      page.getByText(/Reviewer User|Admin User/).first(),
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Reviewer Access — Negative Cases", () => {
  test("reviewer does NOT see Upload tab on opening page", async ({ page }) => {
    await loginAs(page, REVIEWER_EMAIL);
    await page.goto(`/protected/opening/${OPENING_ID}`);
    await page.waitForTimeout(3000);

    // Upload tab is admin-only
    const uploadTab = page.getByRole("link", { name: "Upload Data" });
    await expect(uploadTab).not.toBeVisible();
  });

  test("reviewer does NOT see Questions tab on opening page", async ({
    page,
  }) => {
    await loginAs(page, REVIEWER_EMAIL);
    await page.goto(`/protected/opening/${OPENING_ID}`);
    await page.waitForTimeout(3000);

    // Questions tab is admin-only
    const questionsTab = page.getByRole("link", { name: "Questions" });
    await expect(questionsTab).not.toBeVisible();
  });

  test("reviewer from ORG_1 can view ORG_2 public page but not admin controls", async ({
    page,
  }) => {
    const ORG_2 = "00000002-0000-0000-0000-000000000002"; // HackRice Planning
    await loginAs(page, REVIEWER_EMAIL);
    await page.goto(`/protected/org/${ORG_2}`);
    await page.waitForTimeout(3000);

    // Non-members can view the org page and see open openings (public by design)
    expect(page.url()).toContain(ORG_2);
    await expect(page.getByText("Event Coordinator").first()).toBeVisible({
      timeout: 10000,
    });
    // Admin controls (add position, edit members) are NOT shown to non-members
    await expect(
      page.getByRole("button", { name: "Add position" }),
    ).not.toBeVisible();
  });
});
