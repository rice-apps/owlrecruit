import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Avatar, Title, Stack, Box } from "@mantine/core";
import ProfileForm from "./profileForm";
import type { OrgMembership } from "./organizations-section";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) redirect("/");

  const { data: userRecord } = await supabase
    .from("users")
    .select("name")
    .eq("id", userData.user.id)
    .single();

  const fullName = userRecord?.name ?? "";
  const nameParts = fullName.trim().split(" ");
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");
  const userEmail = userData.user.email ?? "";
  const avatarUrl: string = userData.user.user_metadata?.avatar_url ?? "";
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";

  const { data: rawMemberships } = await supabase
    .from("org_members")
    .select("id, org_id, role, orgs(id, name)")
    .eq("user_id", userData.user.id);

  const orgMemberships: OrgMembership[] = (rawMemberships ?? []).map((m) => {
    const org = Array.isArray(m.orgs) ? m.orgs[0] : m.orgs;
    return {
      id: m.id,
      org_id: m.org_id,
      role: m.role,
      org_name: org?.name ?? "Unknown Organization",
    };
  });

  return (
    <Stack maw={640}>
      <Title order={2}>Profile Information</Title>

      <Box>
        <Avatar
          src={avatarUrl || undefined}
          size={80}
          radius="xl"
          color="owlPurple"
        >
          {initials}
        </Avatar>
      </Box>

      <ProfileForm
        firstName={firstName}
        lastName={lastName}
        email={userEmail}
        userId={userData.user.id}
        orgMemberships={orgMemberships}
      />
    </Stack>
  );
}
