import { Avatar, Card, Text, Badge } from "@mantine/core";
import { Application, ApplicationStatus, Opening, Org } from "@/types/app";
import { getApplicationStatusColor } from "@/lib/status";

export interface ApplicationWithDetails extends Application {
  opening: Pick<Opening, "title" | "closes_at"> & {
    org: Pick<Org, "name"> & { logo_url?: string | null };
  };
}

interface ApplicationCardProps {
  application: ApplicationWithDetails;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
  const { opening, status } = application;
  const { org } = opening;

  const isPending = status === ApplicationStatus.NO_STATUS || !status;

  return (
    <Card
      radius="lg"
      shadow="sm"
      p="md"
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      {/* Org logo */}
      <Avatar
        src={org.logo_url || undefined}
        radius="md"
        size={48}
        color="initials"
        name={org.name}
      />

      <Text fw={700} size="lg" lh={1.2} mt="sm" mb={4}>
        {opening.title}
      </Text>
      <Text size="sm" c="dimmed" mb="xs">
        {org.name}
      </Text>

      <Badge
        color={getApplicationStatusColor(
          status as Parameters<typeof getApplicationStatusColor>[0],
        )}
        variant={isPending ? "outline" : "filled"}
        radius="xl"
        size="sm"
        mt="xs"
        w="fit-content"
      >
        {status || ApplicationStatus.NO_STATUS}
      </Badge>

      <Text size="xs" c="dimmed" mt="auto" pt="xs">
        {opening.closes_at
          ? `Due ${new Date(opening.closes_at).toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
            })}`
          : "No deadline"}
      </Text>
    </Card>
  );
}
