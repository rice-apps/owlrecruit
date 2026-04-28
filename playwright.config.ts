import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load local Supabase credentials before the dev server starts.
// Next.js respects already-set process.env vars over .env.local,
// so this makes the dev server use local Supabase during tests.
try {
  const lines = readFileSync(resolve(__dirname, ".env.test"), "utf-8").split(
    "\n",
  );
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eqIdx = trimmed.indexOf("=");
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
} catch {
  // .env.test is optional — missing file is not an error
}

export default defineConfig({
  testDir: "./tests/integration",
  fullyParallel: false, // tests within a file run serially; files run in parallel
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 6,
  reporter: "list",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Start dev server automatically when running tests
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60000,
  },
});
