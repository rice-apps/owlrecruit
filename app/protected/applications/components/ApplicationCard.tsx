"use client";

import Link from "next/link";
import { Card, Group, Text, Avatar, Stack, Box } from "@mantine/core";
import { ApplicationStatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { Enums } from "@/types/supabase";

interface ApplicationCardProps {
  application: {
    org_id: string;
    opening_id: string;
    status: Enums<"status"> | null;
    created_at: string | null;
    opening_title?: string;
    org_name?: string;
    closes_at?: string | null;
  };
}

export default function ApplicationCard({ application }: ApplicationCardProps) {
  return (
    <Card
      component={Link}
      href={`/protected/org/${application.org_id}`}
      padding={0}
      radius="md"
      withBorder
      shadow="sm"
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      {/* Pink header band */}
      <Box bg="pink.3" h={56} pos="relative">
        <Avatar
          pos="absolute"
          bottom={-20}
          left={16}
          size={40}
          radius="md"
          bg="white"
          color="pink"
          fw={700}
        >
          {(application.org_name ?? "?").charAt(0).toUpperCase()}
        </Avatar>
      </Box>

      <Stack gap={4} p="md" pt={28}>
        <Text fw={700} size="md" lh={1.3}>
          {application.opening_title ?? "Unknown Position"}
        </Text>
        <Text size="sm" c="dimmed">
          {application.org_name ?? "Unknown Organization"}
        </Text>
        <Group gap="xs" mt={4}>
          <ApplicationStatusBadge status={application.status ?? "No Status"} />
        </Group>
        {application.closes_at && (
          <Text size="xs" c="dimmed">
            Due {formatDate(application.closes_at)}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
