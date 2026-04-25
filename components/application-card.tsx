import { Badge, Box, Card, Group, Text } from "@mantine/core";
import { Application, Opening, Org } from "@/types/app";
import { getApplicationStatusColor } from "@/lib/status";

export interface ApplicationWithDetails extends Application {
  opening: Pick<Opening, "title" | "closes_at"> & {
    org: Pick<Org, "name">;
  };
}

interface ApplicationCardProps {
  application: ApplicationWithDetails;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const { opening, status } = application;
  const { org } = opening;

  return (
    <Card
      withBorder
      radius="md"
      p="md"
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <Box
        style={{
          width: 48,
          height: 48,
          borderRadius: "var(--mantine-radius-md)",
          background: "#db2777",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 700,
          fontSize: 20,
          marginBottom: 8,
        }}
      >
        {org.name.charAt(0)}
      </Box>

      <Text fw={700} size="lg" lh={1.2} mb={4}>
        {opening.title}
      </Text>
      <Text size="sm" c="dimmed" mb="sm">
        {org.name}
      </Text>

      <Box style={{ flex: 1 }}>
        <Badge
          color={getApplicationStatusColor(
            status as Parameters<typeof getApplicationStatusColor>[0],
          )}
          variant="light"
          size="sm"
        >
          {status || "Pending"}
        </Badge>
      </Box>

      <Group
        justify="space-between"
        mt="md"
        pt="md"
        style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}
      >
        <Text size="xs" c="dimmed">
          {opening.closes_at
            ? `Due ${new Date(opening.closes_at).toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              })}`
            : "No deadline"}
        </Text>
      </Group>
    </Card>
  );
}
