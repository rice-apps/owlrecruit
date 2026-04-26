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
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.warn(`Error during signout (proceeding anyway): ${error.message}`);
    }
  } else {
    logger.info("No active session found during signout");
  }

  const url = req.nextUrl.clone();
  url.pathname = "/";
  return NextResponse.redirect(url, {
    status: 302,
  });
}
