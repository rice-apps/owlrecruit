import type { Page } from "@playwright/test";
import { loginAs } from "./auth";

/**
 * Log in and navigate to a page so that the Supabase browser client
 * syncs the localStorage session to cookies. After this call,
 * `page.request` will carry the authenticated session.
 */
export async function warmSession(page: Page, email: string): Promise<void> {
  await loginAs(page, email);
  await page.goto("/protected/discover");
}

export function apiGet(page: Page, path: string) {
  return page.request.get(path);
}

export function apiPost(page: Page, path: string, body: unknown) {
  return page.request.post(path, {
    data: body,
    headers: { "Content-Type": "application/json" },
  });
}

export function apiPatch(page: Page, path: string, body: unknown) {
  return page.request.patch(path, {
    data: body,
    headers: { "Content-Type": "application/json" },
  });
}

export function apiDelete(page: Page, path: string) {
  return page.request.delete(path);
}
