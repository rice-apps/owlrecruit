import { createClient } from "@/lib/supabase/server";
import { AppShellWrapper } from "@/components/AppShellWrapper";
import { Box } from "@mantine/core";
import type { OrgWithRole } from "@/types/app";

export default async function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();

  let orgs: OrgWithRole[] = [];
  let user = { name: "", email: "", avatarUrl: "" };

  if (authData?.claims) {
    const userId = authData.claims.sub;
    const userMetadata = authData.claims.user_metadata as {
      full_name?: string;
      email?: string;
      avatar_url?: string;
    };

    const { data: memberships } = await supabase
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

    orgs = (memberships ?? [])
      .filter((m) => m.orgs !== null)
      .map((m) => ({
        ...(m.orgs as unknown as OrgWithRole),
        role: m.role as OrgWithRole["role"],
      }));

    user = {
      name: userMetadata.full_name || "User",
      email: userMetadata.email || "",
      avatarUrl: userMetadata.avatar_url || "",
    };
  }

  return (
    <AppShellWrapper orgs={orgs} user={user}>
      <Box maw={672} mx="auto">
        {children}
      </Box>
    </AppShellWrapper>
  );
}
