import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Check if we have a user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    console.log("Signing out user:", user.email);
    await supabase.auth.signOut();
  } else {
    console.log("No active session found during signout");
  }

  return NextResponse.redirect(new URL("/", req.url), {
    status: 302,
  });
}
