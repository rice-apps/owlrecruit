import { redirect } from "next/navigation";
import { AppShell, AppShellMain } from "@mantine/core";
import { createClient } from "@/lib/supabase/server";
import { AppNavbar } from "@/components/AppNavbar";
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
        social_links,
        logo_url
      )
    `,
    )
    .eq("user_id", userId);

  if (membershipsError) {
    logger.error("Error fetching org memberships:", membershipsError);
  }

  const orgs: OrgWithRole[] = (memberships ?? [])
    .filter(
      (m): m is typeof m & { orgs: NonNullable<typeof m.orgs> } =>
        m.orgs !== null,
    )
    .map((m) => {
      const orgData = Array.isArray(m.orgs) ? m.orgs[0] : m.orgs;
      return { ...orgData, role: m.role };
    });

  const { data: userRecord } = await supabase
    .from("users")
    .select("name")
    .eq("id", userId)
    .single();

  const user = {
    name: userRecord?.name || userMetadata.full_name || "User",
    email: userMetadata.email || "",
  };

  return (
    <AppShell navbar={{ width: 240, breakpoint: "sm" }} padding="md">
      <AppNavbar orgs={orgs} user={user} />
      <AppShellMain bg="gray.0">{children}</AppShellMain>
    </AppShell>
  );
}
