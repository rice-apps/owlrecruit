import { type Page } from "@playwright/test";
import crypto from "crypto";

interface AuthSession {
  accessToken: string;
  refreshToken: string;
}

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Local Supabase default JWT secret — same across all local projects
const LOCAL_JWT_SECRET =
  "super-secret-jwt-token-with-at-least-32-characters-long";

// Maps test email → auth user UUID (from supabase/seed/01-users.sql)
const TEST_USER_IDS: Record<string, string> = {
  "admin@test.owlrecruit.local": "00000001-0000-0000-0000-000000000001",
  "reviewer@test.owlrecruit.local": "00000001-0000-0000-0000-000000000002",
  "interviewer@test.owlrecruit.local": "00000001-0000-0000-0000-000000000003",
  "applicant1@test.owlrecruit.local": "00000001-0000-0000-0000-000000000004",
  "applicant2@test.owlrecruit.local": "00000001-0000-0000-0000-000000000005",
};

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function mintToken(email: string): string {
  const sub = TEST_USER_IDS[email];
  if (!sub) throw new Error(`No test user ID for ${email}`);

  const header = base64url(
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })),
  );
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(
    Buffer.from(
      JSON.stringify({
        aud: "authenticated",
        role: "authenticated",
        email,
        sub,
        iss: "supabase-demo",
        iat: now,
        exp: now + 3600,
        user_metadata: {},
        app_metadata: { provider: "email", providers: ["email"] },
      }),
    ),
  );

  const signingInput = `${header}.${payload}`;
  const signature = base64url(
    crypto.createHmac("sha256", LOCAL_JWT_SECRET).update(signingInput).digest(),
  );

  return `${signingInput}.${signature}`;
}

/**
 * Derive the cookie name @supabase/supabase-js uses for auth session storage.
 * Formula: sb-<first segment of Supabase URL hostname>-auth-token
 * e.g. http://127.0.0.1:54321 → sb-127-auth-token
 */
function authCookieName(): string {
  const hostname = new URL(SUPABASE_URL).hostname;
  return `sb-${hostname.split(".")[0]}-auth-token`;
}

/**
 * Sign in via GoTrue email/password and return session tokens.
 * Used directly by the auth-boundaries smoke test to verify the hook.
 */
export async function signInViaApi(
  email: string,
  password = "TestPassword123!",
): Promise<AuthSession> {
  if (!SUPABASE_ANON_KEY) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set. Ensure .env.test is loaded.",
    );
  }
  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Sign-in failed for ${email}: ${response.status} ${body}`);
  }

  const data = await response.json();
  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}

/**
 * Log in as a test user by minting a valid HS256 JWT directly — no GoTrue call.
 * Injects the token into the browser cookie store so @supabase/ssr picks it up.
 */
export async function loginAs(page: Page, email: string): Promise<void> {
  const accessToken = mintToken(email);
  const cookieName = authCookieName();
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;

  const sessionValue = JSON.stringify({
    access_token: accessToken,
    refresh_token: "dummy-refresh",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: expiresAt,
  });

  await page.context().addCookies([
    {
      name: cookieName,
      value: sessionValue,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}
