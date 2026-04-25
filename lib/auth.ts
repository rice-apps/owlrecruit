import { SupabaseClient } from "@supabase/supabase-js";
import { err } from "./api-response";

export type OrgRole = "admin" | "reviewer";

export interface OrgMemberContext {
  userId: string;
  role: OrgRole;
}

/**
 * Returns the current user's membership in the given org, or null if not a member.
 */
export async function getOrgMember(
  supabase: SupabaseClient,
  orgId: string,
): Promise<OrgMemberContext | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return { userId: user.id, role: data.role as OrgRole };
}

/**
 * Returns the current user's membership context, or throws a 403 NextResponse if not a member.
 */
export async function requireOrgMember(
  supabase: SupabaseClient,
  orgId: string,
): Promise<OrgMemberContext> {
  const ctx = await getOrgMember(supabase, orgId);
  if (!ctx) throw err("Forbidden", 403);
  return ctx;
}

/**
 * Returns the current user's membership context, or throws a 403 NextResponse if not an admin.
 */
export async function requireOrgAdmin(
  supabase: SupabaseClient,
  orgId: string,
): Promise<OrgMemberContext> {
  const ctx = await getOrgMember(supabase, orgId);
  if (!ctx || ctx.role !== "admin") throw err("Forbidden: admin only", 403);
  return ctx;
}

/**
 * Returns the authenticated user's ID, or throws a 401 NextResponse.
 */
export async function requireAuth(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw err("Unauthorized", 401);
  return user.id;
}
