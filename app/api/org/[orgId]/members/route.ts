import { createClient } from "@/lib/supabase/server";
import { ok, err } from "@/lib/api-response";
import { requireOrgMember, requireOrgAdmin } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();

    await requireOrgMember(supabase, orgId);

    const { searchParams } = new URL(request.url);
    const roles = searchParams.get("role")?.split(",") || [];

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

    if (error) return err(error.message, 500);
    return ok(data);
  } catch (e) {
    if (e instanceof Response) return e;
    return err("Internal Server Error", 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();

    await requireOrgAdmin(supabase, orgId);

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role || !["admin", "reviewer"].includes(role)) {
      return err("Missing or invalid fields");
    }

    const { data, error } = await supabase
      .from("org_members")
      .insert({ org_id: orgId, user_id: userId, role })
      .select()
      .single();

    if (error) return err(error.message, 500);
    return ok(data, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return err("Internal Server Error", 500);
  }
}
