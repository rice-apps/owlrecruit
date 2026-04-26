import { createClient } from "@/lib/supabase/server";
import { ok, err } from "@/lib/api-response";
import { requireOrgMember } from "@/lib/auth";
import { createRequestLogger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const log = createRequestLogger({
    method: "GET",
    path: `/api/org/${orgId}/members/search`,
    org_id: orgId,
  });
  try {
    const supabase = await createClient();

    const { userId } = await requireOrgMember(supabase, orgId);
    log.set({ user_id: userId });

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("q") || "";
    log.set({ search_query: searchQuery });

    const { data: members, error: membersError } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", orgId);

    if (membersError) {
      log.error("Error fetching member ids", membersError);
      log.flush(500);
      return err(membersError.message, 500);
    }

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

    if (usersError) {
      log.error("Error searching users", usersError);
      log.flush(500);
      return err(usersError.message, 500);
    }

    log.set({ result_count: users?.length ?? 0 });
    log.flush(200);
    return ok(users);
  } catch (e) {
    if (e instanceof Response) return e;
    log.error("Unexpected error searching members", e);
    log.flush(500);
    return err("Internal Server Error", 500);
  }
}
