"use client";

import { useMemo } from "react";
import { Card, SimpleGrid, Stack, Text } from "@mantine/core";
import {
  type ApplicationStatus,
  ApplicationStatus as AppStatus,
} from "@/types/app";

interface Applicant {
  id: string;
  name: string;
  status: ApplicationStatus;
}

interface OverviewTabProps {
  applicants: Applicant[];
  orgId: string;
  openingId: string;
  openingStatus: string | null;
  applicationLink: string | null;
}

export function OverviewTab({ applicants }: OverviewTabProps) {
  const totalSubmissions = applicants.length;

  const acceptedCount = useMemo(
    () =>
      applicants.filter((a) => a.status === AppStatus.ACCEPTED_OFFER).length,
    [applicants],
  );

  const rejectedCount = useMemo(
    () => applicants.filter((a) => a.status === AppStatus.REJECTED).length,
    [applicants],
  );

  const acceptanceRate =
    totalSubmissions > 0
      ? `${((acceptedCount / totalSubmissions) * 100).toFixed(0)}%`
      : "0%";

  return (
    <Stack gap="lg" py="lg">
      {/* 4 Stat cards */}
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md">
        <Card
          radius="lg"
          p="md"
          style={{ border: "1px solid var(--mantine-color-gray-2)" }}
        >
          <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb="xs">
            Submissions
          </Text>
          <Text size="2rem" fw={700}>
            {totalSubmissions}
          </Text>
        </Card>

        <Card
          radius="lg"
          p="md"
          style={{ border: "1px solid var(--mantine-color-gray-2)" }}
        >
          <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb="xs">
            Accepted
          </Text>
          <Text size="2rem" fw={700}>
            {acceptedCount}
          </Text>
        </Card>

        <Card
          radius="lg"
          p="md"
          style={{ border: "1px solid var(--mantine-color-gray-2)" }}
        >
          <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb="xs">
            Rejected
          </Text>
          <Text size="2rem" fw={700}>
            {rejectedCount}
          </Text>
        </Card>

        <Card
          radius="lg"
          p="md"
          style={{ border: "1px solid var(--mantine-color-gray-2)" }}
        >
          <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb="xs">
            Acceptance Rate
          </Text>
          <Text size="2rem" fw={700}>
            {acceptanceRate}
          </Text>
        </Card>
      </SimpleGrid>

      {/* Recent Feedback */}
      <Stack gap="sm">
        <Text
          fw={600}
          size="sm"
          tt="uppercase"
          style={{ letterSpacing: "0.05em" }}
        >
          Recent Feedback
        </Text>
        <Card
          radius="lg"
          p="xl"
          style={{ border: "1px solid var(--mantine-color-gray-2)" }}
        >
          <Text size="sm" c="dimmed" ta="center">
            No feedback yet
          </Text>
        </Card>
      </Stack>
    </Stack>
  );
}
