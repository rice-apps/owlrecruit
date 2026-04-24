import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Check if we have a user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    logger.info(`Signing out user: ${user.id}`);
    await supabase.auth.signOut();
  } else {
    logger.info("No active session found during signout");
  }

  return NextResponse.redirect(new URL("/", req.url), {
    status: 302,
  });
}
