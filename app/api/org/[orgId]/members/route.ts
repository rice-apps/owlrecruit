import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const supabase = await createClient();
    const { orgId } = await params;
    const { searchParams } = new URL(request.url);
    const roles = searchParams.get("role")?.split(",") || [];

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Base query
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

    // Filter by roles if provided
    if (roles.length > 0) {
      query = query.in("role", roles);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching org members:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
