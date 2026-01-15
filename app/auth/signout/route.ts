import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  console.log("Signout route hit");
  const supabase = await createClient();

  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    console.log("Signing out user:", session.user.email);
    await supabase.auth.signOut();
  } else {
    console.log("No active session found during signout");
  }

  return NextResponse.redirect(new URL("/", req.url), {
    status: 302,
  });
}
