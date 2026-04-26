import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logger";

export async function GET() {
  const log = createRequestLogger({ method: "GET", path: "/api/auth/me" });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    log.flush(401);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  log.set({ user_id: user.id });
  log.flush(200);
  return NextResponse.json({ id: user.id });
}
