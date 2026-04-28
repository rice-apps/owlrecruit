import { createClient } from "@/lib/supabase/server";
import { ok, err } from "@/lib/api-response";
import { requireOrgMember, requireOrgAdmin } from "@/lib/auth";
import { createRequestLogger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const log = createRequestLogger({
    method: "GET",
    path: `/api/org/${orgId}/members`,
    org_id: orgId,
  });
  try {
    const supabase = await createClient();

    const { userId } = await requireOrgMember(supabase, orgId);
    log.set({ user_id: userId });

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

    if (error) {
      log.error("error fetching members", error);
      log.flush(500);
      return err(error.message, 500);
    }

    log.set({ member_count: data?.length ?? 0 });
    log.flush(200);
    return ok(data);
  } catch (e) {
    if (e instanceof Response) return e;
    log.error("unexpected error fetching members", e);
    log.flush(500);
    return err("Internal Server Error", 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const log = createRequestLogger({
    method: "POST",
    path: `/api/org/${orgId}/members`,
    org_id: orgId,
  });
  try {
    const supabase = await createClient();

    const { userId } = await requireOrgAdmin(supabase, orgId);
    log.set({ user_id: userId });

    const body = await request.json();
    const { userId: targetUserId, role } = body;
    log.set({ target_user_id: targetUserId, new_role: role });

    if (!targetUserId || !role || !["admin", "reviewer"].includes(role)) {
      log.flush(400);
      return err("Missing or invalid fields");
    }

    const { data, error } = await supabase
      .from("org_members")
      .insert({ org_id: orgId, user_id: targetUserId, role })
      .select()
      .single();

    if (error) {
      log.error("error adding member", error);
      if (error.code === "23505") {
        log.flush(409);
        return err("User is already a member of this organization", 409);
      }
      log.flush(500);
      return err(error.message, 500);
    }

    log.flush(201);
    return ok(data, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    log.error("unexpected error adding member", e);
    log.flush(500);
    return err("Internal Server Error", 500);
  }
}
