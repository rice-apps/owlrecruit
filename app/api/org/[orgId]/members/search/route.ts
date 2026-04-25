import { createClient } from "@/lib/supabase/server";
import { ok, err } from "@/lib/api-response";
import { requireOrgMember } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params;
    const supabase = await createClient();

    await requireOrgMember(supabase, orgId);

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("q") || "";

    const { data: members, error: membersError } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", orgId);

    if (membersError) return err(membersError.message, 500);

    const memberIds = members?.map((m) => m.user_id) ?? [];

    let query = supabase.from("users").select("id, name, email");

    if (memberIds.length > 0) {
      query = query.not("id", "in", `(${memberIds.join(",")})`);
    }

    if (searchQuery) {
      query = query.or(
        `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`,
      );
    }

    const { data: users, error: usersError } = await query.limit(10);

    if (usersError) return err(usersError.message, 500);
    return ok(users);
  } catch (e) {
    if (e instanceof Response) return e;
    return err("Internal Server Error", 500);
  }
}
