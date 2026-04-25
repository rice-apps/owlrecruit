import {
  Avatar,
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Text,
  ActionIcon,
} from "@mantine/core";
import { ChevronDown, Eye, Users01, File02 } from "@untitled-ui/icons-react";
import { EditOrgDialog } from "@/components/edit-org-dialog";

type OrgPageHeaderProps = {
  orgId: string;
  displayOrgName: string;
  orgDescription: string | null;
  isAdmin: boolean;
  hasRoleError: boolean;
  logoUrl?: string | null;
  memberCount: number;
  openPositionCount: number;
};

export function OrgPageHeader({
  orgId,
  displayOrgName,
  orgDescription,
  isAdmin,
  hasRoleError,
  logoUrl,
  memberCount,
  openPositionCount,
}: OrgPageHeaderProps) {
  const orgInitial = displayOrgName.charAt(0).toUpperCase();

  return (
    <Card radius="lg" shadow="sm" p="xl">
      <Group justify="space-between" align="center">
        {/* Left: logo + name + counts */}
        <Group align="center" gap="md">
          <Avatar src={logoUrl || undefined} radius="md" size={56} color="gray">
            {orgInitial}
          </Avatar>
          <Stack gap={4}>
            <Text fw={700} size="xl">
              {displayOrgName}
            </Text>
            <Group gap="xs">
              <Users01
                width={14}
                height={14}
                color="var(--mantine-color-gray-5)"
              />
              <Text size="sm" c="dimmed">
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </Text>
              <File02
                width={14}
                height={14}
                color="var(--mantine-color-gray-5)"
              />
              <Text size="sm" c="dimmed">
                {openPositionCount} open{" "}
                {openPositionCount === 1 ? "position" : "positions"}
              </Text>
            </Group>
          </Stack>
        </Group>

        {/* Right: admin controls */}
        {isAdmin && !hasRoleError && (
          <Group gap="xs">
            <Badge color="owlTeal" variant="filled" radius="xl">
              Admin
            </Badge>
            <Button
              variant="outline"
              radius="xl"
              color="gray"
              size="xs"
              rightSection={<ChevronDown width={14} height={14} />}
            >
              Joined
            </Button>
            <ActionIcon variant="subtle" color="gray" aria-label="Preview">
              <Eye width={16} height={16} />
            </ActionIcon>
            <EditOrgDialog
              orgId={orgId}
              orgName={displayOrgName}
              orgDescription={orgDescription}
            />
          </Group>
        )}
      </Group>
    </Card>
  );
}
