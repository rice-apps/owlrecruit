import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Text,
  Stack,
  SimpleGrid,
  Card,
  Avatar,
  Group,
  Badge,
  Button,
} from "@mantine/core";
import type { OrgWithRole } from "@/types/app";

export default async function MyOrgsPage() {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims) redirect("/");

  const userId = authData.claims.sub;

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
        social_links,
        logo_url
      )
    `,
    )
    .eq("user_id", userId);

  const orgs: OrgWithRole[] = (memberships ?? [])
    .filter(
      (m): m is typeof m & { orgs: NonNullable<typeof m.orgs> } =>
        m.orgs !== null,
    )
    .map((m) => {
      const orgData = Array.isArray(m.orgs) ? m.orgs[0] : m.orgs;
      return { ...orgData, role: m.role };
    });

  return (
    <Stack gap="lg">
      <Box
        bg="dark.6"
        p="xl"
        style={{ borderRadius: "var(--mantine-radius-xl)" }}
      >
        <Group justify="space-between" align="flex-start">
          <div>
            <Text c="white" fw={700} size="xl" mb={4}>
              My Organizations
            </Text>
            <Text c="dark.2" size="sm">
              Organizations you are a member of.
            </Text>
          </div>
          <Link href="/protected/createorg" style={{ textDecoration: "none" }}>
            <Button color="dark" radius="xl" size="sm">
              Create organization
            </Button>
          </Link>
        </Group>
      </Box>

      {orgs.length === 0 ? (
        <Stack align="center" py="xl" gap="md">
          <Text c="dimmed">You are not a member of any organizations yet.</Text>
        </Stack>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {orgs.map((org) => (
            <Link
              key={org.id}
              href={`/protected/org/${org.id}`}
              style={{ textDecoration: "none" }}
            >
              <Card radius="lg" withBorder={false} shadow="sm">
                <Group gap="sm" mb="sm">
                  <Avatar
                    radius="md"
                    size={44}
                    color="initials"
                    name={org.name}
                  />
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={600} size="sm" truncate>
                      {org.name}
                    </Text>
                    {org.role === "admin" && (
                      <Badge
                        color="owlTeal"
                        variant="filled"
                        radius="xl"
                        size="xs"
                      >
                        Admin
                      </Badge>
                    )}
                  </Stack>
                </Group>
                <Text size="xs" c="dimmed" lineClamp={2}>
                  {org.description ?? "No description provided."}
                </Text>
              </Card>
            </Link>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
