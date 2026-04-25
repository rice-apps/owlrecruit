import { Avatar, Badge, Card, Group, ScrollArea, Text } from "@mantine/core";

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
    <ScrollArea>
      <Group gap="md" wrap="nowrap" pb="xs">
        {members.map((member) => {
          const displayName =
            member.users?.name?.trim() || member.users?.email || "Unknown";
          const initial = displayName.charAt(0).toUpperCase() || "U";

          return (
            <Card
              key={member.id}
              withBorder
              radius="md"
              p="md"
              style={{ minWidth: 180, maxWidth: 240, flexShrink: 0 }}
            >
              <Group gap="sm">
                <Avatar color="owlPurple" radius="md">
                  {initial}
                </Avatar>
                <div style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate="end">
                    {displayName}
                  </Text>
                  <Badge variant="light" color="owlPurple" size="xs" mt={2}>
                    {member.role === "admin" ? "Admin" : "Reviewer"}
                  </Badge>
                </div>
              </Group>
            </Card>
          );
        })}
      </Group>
    </ScrollArea>
  );
}
