"use client";

import {
  Group,
  Avatar,
  Text,
  Badge,
  Stack,
  Box,
  Button,
  Menu,
} from "@mantine/core";
import { ChevronDown } from "@untitled-ui/icons-react";
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
            py="sm"
            style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}
          >
            <Group gap="sm">
              <Avatar
                radius="md"
                color="initials"
                name={m.org_name}
                size={40}
              />
              <Text size="sm" fw={600}>
                {m.org_name}
              </Text>
            </Group>

            <Group gap="xs">
              {m.role === "admin" && (
                <Badge color="owlTeal" variant="filled" radius="xl" size="sm">
                  Admin
                </Badge>
              )}
              <Menu withinPortal position="bottom-end">
                <Menu.Target>
                  <Button
                    variant="outline"
                    color="gray"
                    radius="xl"
                    size="xs"
                    rightSection={<ChevronDown width={14} height={14} />}
                  >
                    Joined
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <LeaveOrgButton
                    orgId={m.org_id}
                    userId={userId}
                    isAdmin={m.role === "admin"}
                    orgName={m.org_name}
                    asMenuItem
                  />
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        ))}
      </Stack>
    </Box>
  );
}
