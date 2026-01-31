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
