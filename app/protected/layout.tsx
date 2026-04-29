import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShellWrapper } from "@/components/AppShellWrapper";
import type { OrgWithRole } from "@/types/app";
import { logger } from "@/lib/logger";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims) {
    redirect("/");
  }

  const userId = authData.claims.sub;
  const userMetadata = authData.claims.user_metadata as {
    full_name?: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  };

  const { data: memberships, error: membershipsError } = await supabase
    .from("org_members")
    .select(
      `
      role,
      orgs (
        id,
        name,
        description,
        created_at,
        updated_at,
        logo_url
      )
    `,
    )
    .eq("user_id", userId);

  if (membershipsError) {
    logger.error({ err: membershipsError }, "error fetching org memberships");
  }

  const orgs: OrgWithRole[] = (memberships ?? [])
    .filter((m) => m.orgs !== null)
    .map((m) => ({
      ...(m.orgs as unknown as OrgWithRole),
      role: m.role as OrgWithRole["role"],
    }));

  const { data: userRecord } = await supabase
    .from("users")
    .select("name")
    .eq("id", userId)
    .single();

  const user = {
    name: userRecord?.name || userMetadata.full_name || "User",
    email: userMetadata.email || "",
    avatarUrl: userMetadata.avatar_url || "",
  };

  return (
    <AppShellWrapper orgs={orgs} user={user}>
      {children}
    </AppShellWrapper>
  );
}
