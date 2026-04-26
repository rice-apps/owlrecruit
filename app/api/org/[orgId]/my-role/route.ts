import { createClient } from "@/lib/supabase/server";
import { createRequestLogger } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const log = createRequestLogger({
    method: "GET",
    path: `/api/org/${orgId}/my-role`,
    org_id: orgId,
  });
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.flush(401);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    log.set({ user_id: user.id });

    const { data: membership, error } = await supabase
      .from("org_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .single();

    if (error || !membership) {
      // User is not a member or error occurred. Return null or specific error.
      // Returning 200 with role: null is often easier for frontend handling.
      log.set({ role: null });
      log.flush(200);
      return NextResponse.json({ role: null });
    }

    log.set({ role: membership.role });
    log.flush(200);
    return NextResponse.json({ role: membership.role });
  } catch (error) {
    log.error("Unexpected error fetching my-role", error);
    log.flush(500);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
