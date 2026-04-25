/**
 * OrgStatusCard Component
 *
 * Displays a user's organization memberships and application statuses in a card format.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Box, Card, Group, Loader, Stack, Text } from "@mantine/core";
import type { Enums } from "@/types/supabase";
import { logger } from "@/lib/logger";
import { getApplicationStatusColor } from "@/lib/status";

type ApplicationStatus = Enums<"status">;

interface OrgMembership {
  org_id: string;
  role: Enums<"org_role">;
  created_at: string | null;
  org_name?: string;
}

interface OrgApplication {
  org_id: string;
  opening_id: string;
  status: ApplicationStatus | null;
  created_at: string | null;
  opening_title?: string;
  org_name?: string;
}

interface OrgStatusCardProps {
  userId: string;
}

interface OrgData {
  memberships: OrgMembership[];
  applications: OrgApplication[];
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function OrgStatusCard({ userId }: OrgStatusCardProps) {
  const router = useRouter();
  const [orgData, setOrgData] = useState<OrgData>({
    memberships: [],
    applications: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrgData() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/user/org-status");
        if (!response.ok) throw new Error("Failed to fetch organization data");
        const data: OrgData = await response.json();
        setOrgData(data);
      } catch (err) {
        logger.error("Error fetching org data:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchOrgData();
  }, [userId]);

  const cardContent = () => {
    if (loading) {
      return (
        <Group gap="sm" justify="center" py="xl">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Loading...
          </Text>
        </Group>
      );
    }

    if (error) {
      return (
        <Box ta="center" py="xl">
          <Text c="red" mb="xs">
            Error loading organization data
          </Text>
          <Text size="sm" c="dimmed">
            {error}
          </Text>
        </Box>
      );
    }

    const hasNoData =
      orgData.memberships.length === 0 && orgData.applications.length === 0;
    if (hasNoData) {
      return (
        <Box ta="center" py="xl">
          <Text c="dimmed">
            No organization memberships or applications found.
          </Text>
        </Box>
      );
    }

    return (
      <Stack gap="lg">
        {orgData.memberships.length > 0 && (
          <Stack gap="sm">
            <Text fw={600} size="lg">
              Memberships
            </Text>
            {orgData.memberships.map((membership) => (
              <Box
                key={`${membership.org_id}-${membership.role}`}
                p="sm"
                style={{
                  border: "1px solid var(--mantine-color-gray-2)",
                  borderRadius: "var(--mantine-radius-md)",
                  cursor: "pointer",
                }}
                onClick={() =>
                  router.push(`/protected/org/${membership.org_id}`)
                }
              >
                <Group justify="space-between">
                  <Box>
                    <Text fw={500}>
                      {membership.org_name || "Unknown Organization"}
                    </Text>
                    {membership.created_at && (
                      <Text size="xs" c="dimmed">
                        Joined: {formatDate(membership.created_at)}
                      </Text>
                    )}
                  </Box>
                  <Badge color="owlPurple" variant="light">
                    {membership.role === "admin" ? "Admin" : "Reviewer"}
                  </Badge>
                </Group>
              </Box>
            ))}
          </Stack>
        )}

        {orgData.applications.length > 0 && (
          <Stack gap="sm">
            <Text fw={600} size="lg">
              Applications
            </Text>
            {orgData.applications.map((application) => (
              <Box
                key={`${application.opening_id}-${application.created_at}`}
                p="sm"
                style={{
                  border: "1px solid var(--mantine-color-gray-2)",
                  borderRadius: "var(--mantine-radius-md)",
                  cursor: "pointer",
                }}
                onClick={() =>
                  router.push(`/protected/org/${application.org_id}`)
                }
              >
                <Group justify="space-between">
                  <Box>
                    <Text fw={500}>
                      {application.org_name || "Unknown Organization"}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Position: {application.opening_title || "Not specified"}
                    </Text>
                    {application.created_at && (
                      <Text size="xs" c="dimmed">
                        Applied: {formatDate(application.created_at)}
                      </Text>
                    )}
                  </Box>
                  <Badge
                    color={getApplicationStatusColor(
                      application.status as Parameters<
                        typeof getApplicationStatusColor
                      >[0],
                    )}
                    variant="light"
                  >
                    {application.status ?? "No Status"}
                  </Badge>
                </Group>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    );
  };

  return (
    <Card withBorder radius="md" p="lg">
      <Text fw={700} size="lg" mb="md">
        Organization Status
      </Text>
      {cardContent()}
    </Card>
  );
}
