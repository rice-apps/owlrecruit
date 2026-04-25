"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Card,
  Group,
  SimpleGrid,
  Text,
  Box,
  Stack,
  Button,
} from "@mantine/core";
import { getOpeningStatusColor, getOpeningStatusLabel } from "@/lib/status";
import { formatDate } from "@/lib/utils";

interface OpeningItem {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  closes_at: string | null;
}

interface OpeningsGridProps {
  openings: OpeningItem[];
  orgId: string;
  orgName: string;
  isAdmin: boolean;
}

type FilterStatus = "open" | "closed";

const FILTER_OPTIONS: { label: string; value: FilterStatus }[] = [
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
];

export function OpeningsGrid({
  openings,
  orgId,
  orgName,
  isAdmin,
}: OpeningsGridProps) {
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus | null>(
    null,
  );

  const filteredOpenings = useMemo(() => {
    if (!selectedStatus) return openings;
    return openings.filter((o) => (o.status ?? "draft") === selectedStatus);
  }, [openings, selectedStatus]);

  if (!openings.length) {
    return (
      <Stack align="center" gap="xs" py="xl">
        <Text fw={500} c="dimmed">
          No Openings Yet
        </Text>
        <Text size="sm" c="dimmed">
          {isAdmin
            ? "Create your first opening to start recruiting."
            : "There are no openings for this organization yet."}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Group gap="xs">
        {FILTER_OPTIONS.map((option) => (
          <Button
            key={option.value}
            size="xs"
            variant={selectedStatus === option.value ? "filled" : "outline"}
            color={selectedStatus === option.value ? "cyan" : "gray"}
            onClick={() =>
              setSelectedStatus((cur) =>
                cur === option.value ? null : option.value,
              )
            }
          >
            {option.label}
          </Button>
        ))}
      </Group>

      {filteredOpenings.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
          {filteredOpenings.map((opening) => (
            <Link
              key={opening.id}
              href={`/protected/org/${orgId}/opening/${opening.id}`}
              style={{ textDecoration: "none" }}
            >
              <Card
                withBorder
                radius="lg"
                padding={0}
                style={{ minHeight: 250, overflow: "hidden" }}
              >
                <Box
                  h={64}
                  style={{ background: "var(--mantine-color-red-3)" }}
                />

                <Box
                  style={{
                    position: "absolute",
                    top: 44,
                    left: 16,
                    width: 48,
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    border: "1px solid var(--mantine-color-gray-2)",
                    background: "white",
                  }}
                >
                  <Text fw={600} c="red">
                    {(opening.title || "O").charAt(0).toUpperCase()}
                  </Text>
                </Box>

                <Stack gap="xs" p="md" pt={36}>
                  <Group justify="space-between" align="flex-start" gap="xs">
                    <Text fw={700} size="md" lineClamp={2} style={{ flex: 1 }}>
                      {opening.title || "Untitled Opening"}
                    </Text>
                    <Badge
                      variant="light"
                      color={getOpeningStatusColor(opening.status ?? "draft")}
                      size="sm"
                    >
                      {getOpeningStatusLabel(opening.status ?? "draft")}
                    </Badge>
                  </Group>

                  <Text size="sm" c="dimmed">
                    {orgName}
                  </Text>

                  {opening.description && (
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {opening.description}
                    </Text>
                  )}

                  <Text
                    size="xs"
                    c="dimmed"
                    mt="auto"
                    pt="xs"
                    style={{
                      borderTop: "1px solid var(--mantine-color-gray-2)",
                    }}
                  >
                    {opening.closes_at
                      ? `Due ${formatDate(opening.closes_at)}`
                      : "No deadline"}
                  </Text>
                </Stack>
              </Card>
            </Link>
          ))}
        </SimpleGrid>
      ) : (
        <Text size="sm" c="dimmed" ta="center" py="lg">
          No positions match this status filter.
        </Text>
      )}
    </Stack>
  );
}
