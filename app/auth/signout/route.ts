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
    logger.info({ user_id: user.id }, "signing out user");
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.warn({ err: error }, "error during signout, proceeding anyway");
    }
  } else {
    logger.info("no active session found during signout");
  }

  const url = req.nextUrl.clone();
  url.pathname = "/";
  return NextResponse.redirect(url, {
    status: 302,
  });
}
