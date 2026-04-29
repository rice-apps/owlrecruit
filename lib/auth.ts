import { SupabaseClient } from "@supabase/supabase-js";
import { err } from "./api-response";

type OrgRole = "admin" | "reviewer";

interface OrgMemberContext {
  userId: string;
  role: OrgRole;
}

/**
 * Returns the current user's membership in the given org, or null if not a member.
 */
async function getOrgMember(
  supabase: SupabaseClient,
  orgId: string,
): Promise<OrgMemberContext | null> {
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) return null;

  const { data: membership, error } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !membership) return null;
  return { userId, role: membership.role as OrgRole };
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
