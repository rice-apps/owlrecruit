"use client";

import { Group, Avatar, Text, Badge, Stack, Box } from "@mantine/core";
import { LeaveOrgButton } from "@/components/leave-org-button";
import type { Enums } from "@/types/supabase";

export interface OrgMembership {
  id: string;
  org_id: string;
  role: Enums<"org_role">;
  org_name: string;
}

interface OrganizationsSectionProps {
  memberships: OrgMembership[];
  userId: string;
}

export default function OrganizationsSection({
  memberships,
  userId,
}: OrganizationsSectionProps) {
  if (memberships.length === 0) {
    return (
      <Box>
        <Text size="sm" fw={500} mb="xs">
          Organizations
        </Text>
        <Text size="sm" c="dimmed">
          You are not a member of any organizations yet.
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text size="sm" fw={500} mb="xs">
        Organizations
      </Text>
      <Stack gap={0}>
        {memberships.map((m) => (
          <Group
            key={m.id}
            justify="space-between"
            p="sm"
            style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}
          >
            <Group gap="sm">
              <Avatar radius="md" color="owlPurple" size={40}>
                {m.org_name.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Text size="sm" fw={500}>
                  {m.org_name}
                </Text>
                <Badge variant="light" color="owlPurple" size="xs" mt={2}>
                  {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                </Badge>
              </Box>
            </Group>
            <LeaveOrgButton
              orgId={m.org_id}
              userId={userId}
              isAdmin={m.role === "admin"}
              orgName={m.org_name}
            />
          </Group>
        ))}
      </Stack>
    </Box>
  );
}
