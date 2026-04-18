import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const { searchParams } = new URL(request.url);
  const roles = searchParams.get("role")?.split(",") || [];

  const supabase = await createClient();

  let query = supabase
    .from("org_members")
    .select(
      `
      id,
      user_id,
      role,
      users:user_id (
        id,
        name,
        email
      )
    `,
    )
    .eq("org_id", orgId);

  if (roles.length > 0) {
    query = query.in("role", roles);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can add members
    const { data: callerMembership } = await supabase
      .from("org_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .single();

    if (callerMembership?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can add members" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role || !["admin", "reviewer"].includes(role)) {
      return NextResponse.json(
        { error: "Missing or invalid fields" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("org_members")
      .insert({
        org_id: orgId,
        user_id: userId,
        role: role,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
