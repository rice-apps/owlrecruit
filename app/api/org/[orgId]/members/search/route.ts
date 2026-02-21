import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("q") || "";

    const supabase = await createClient();

    // First get all current members of the org
    const { data: members, error: membersError } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", orgId);

    if (membersError) {
      return NextResponse.json(
        { error: membersError.message },
        { status: 500 },
      );
    }

    const memberIds = members?.map((m) => m.user_id) || [];

    // Then search for users not in that list
    let query = supabase.from("users").select("id, name, email");

    if (memberIds.length > 0) {
      query = query.not("id", "in", `(${memberIds.join(",")})`);
    }

    if (searchQuery) {
      query = query.or(
        `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`,
      );
    }

    const { data: users, error: usersError } = await query.limit(5);

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    return NextResponse.json(users);
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
