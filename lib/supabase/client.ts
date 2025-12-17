import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for browser-side operations.
 * This client is configured with the public URL and publishable key
 * from environment variables.
 *
 * @returns A configured Supabase browser client
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
