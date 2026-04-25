import { Avatar, Badge, Divider, Group, Stack, Text } from "@mantine/core";

export type OrgMemberRecord = {
  id: string;
  user_id: string;
  role: "admin" | "reviewer";
  users: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

type MembersStripProps = {
  members: OrgMemberRecord[];
};

export function MembersStrip({ members }: MembersStripProps) {
  if (members.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" p="xl">
        No members have joined this organization yet.
      </Text>
    );
  }

  return (
    <Stack gap={0}>
      {members.map((member, i) => {
        const displayName =
          member.users?.name?.trim() || member.users?.email || "Unknown";
        const email = member.users?.email || "";
        const initial = displayName.charAt(0).toUpperCase() || "U";
        const isAdmin = member.role === "admin";

        return (
          <div key={member.id}>
            <Group justify="space-between" align="center" py="xs">
              {/* Left: avatar + name + email */}
              <Group gap="sm">
                <Avatar radius="xl" size={40} color="gray">
                  {initial}
                </Avatar>
                <Stack gap={0}>
                  <Text size="sm" fw={600}>
                    {displayName}
                  </Text>
                  {email && (
                    <Text size="xs" c="dimmed">
                      {email}
                    </Text>
                  )}
                </Stack>
              </Group>

              {/* Right: role badge */}
              <Badge
                color={isAdmin ? "owlTeal" : "gray"}
                variant={isAdmin ? "filled" : "outline"}
                radius="xl"
                size="sm"
              >
                {isAdmin ? "Admin" : "Reviewer"}
              </Badge>
            </Group>
            {i < members.length - 1 && <Divider />}
          </div>
        );
      })}
    </Stack>
  );
}
