import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = Promise<{ orgId: string; userId: string }>;

/**
 * Shared helper: authenticate the caller, look up their role in the org,
 * and count total admins. Returns everything the handlers need to authorise.
 */
async function getAuthContext(orgId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { supabase, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  // Caller's membership
  const { data: callerMembership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .single();

  // Count admins in the org
  const { count: adminCount } = await supabase
    .from("org_members")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("role", "admin");

  return {
    supabase,
    callerId: user.id,
    callerRole: callerMembership?.role as "admin" | "reviewer" | null,
    adminCount: adminCount ?? 0,
    error: null,
  };
}

export async function PUT(
  request: Request,
  { params }: { params: Params },
) {
  try {
    const { orgId, userId } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role || !["admin", "reviewer"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid or missing role" },
        { status: 400 },
      );
    }

    const ctx = await getAuthContext(orgId);
    if (ctx.error) return ctx.error;

    // Only admins can change roles
    if (ctx.callerRole !== "admin") {
      return NextResponse.json(
        { error: "Only admins can change member roles" },
        { status: 403 },
      );
    }

    // Prevent demoting the last admin
    if (role === "reviewer") {
      const { data: targetMembership } = await ctx.supabase
        .from("org_members")
        .select("role")
        .eq("user_id", userId)
        .eq("org_id", orgId)
        .single();

      if (targetMembership?.role === "admin" && ctx.adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the only admin. Transfer admin role first." },
          { status: 403 },
        );
      }
    }

    const { error } = await ctx.supabase
      .from("org_members")
      .update({ role })
      .eq("org_id", orgId)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Params },
) {
  try {
    const { orgId, userId } = await params;

    const ctx = await getAuthContext(orgId);
    if (ctx.error) return ctx.error;

    const isSelf = ctx.callerId === userId;

    if (isSelf) {
      // Leaving the org — block if they're the only admin
      if (ctx.callerRole === "admin" && ctx.adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot leave as the only admin. Transfer admin role first." },
          { status: 403 },
        );
      }
    } else {
      // Removing someone else — must be an admin
      if (ctx.callerRole !== "admin") {
        return NextResponse.json(
          { error: "Only admins can remove members" },
          { status: 403 },
        );
      }

      // Prevent removing the last admin
      const { data: targetMembership } = await ctx.supabase
        .from("org_members")
        .select("role")
        .eq("user_id", userId)
        .eq("org_id", orgId)
        .single();

      if (targetMembership?.role === "admin" && ctx.adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the only admin" },
          { status: 403 },
        );
      }
    }

    const { error } = await ctx.supabase
      .from("org_members")
      .delete()
      .eq("org_id", orgId)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
