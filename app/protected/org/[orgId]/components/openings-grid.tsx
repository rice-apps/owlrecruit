"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Avatar,
  Button,
  Card,
  Group,
  SimpleGrid,
  Text,
  Stack,
  Menu,
  ActionIcon,
} from "@mantine/core";
import { DotsVertical } from "@untitled-ui/icons-react";
import { getOpeningStatusLabel } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import { OpeningStatusBadge } from "@/components/StatusBadge";

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

type FilterStatus = "open" | "closed" | "draft";

const FILTER_OPTIONS: { label: string; value: FilterStatus }[] = [
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
  { label: "Draft", value: "draft" },
];

export function OpeningsGrid({
  openings,
  orgId,
  orgName,
  isAdmin,
}: OpeningsGridProps) {
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("open");

  const filteredOpenings = useMemo(
    () => openings.filter((o) => (o.status ?? "draft") === selectedStatus),
    [openings, selectedStatus],
  );

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
      {/* Open / Closed / Draft toggle */}
      <Group gap="xs">
        {FILTER_OPTIONS.filter(
          (option) => option.value !== "draft" || isAdmin,
        ).map((option) => (
          <Button
            key={option.value}
            size="xs"
            radius="xl"
            variant={selectedStatus === option.value ? "filled" : "outline"}
            color={selectedStatus === option.value ? "dark" : "gray"}
            onClick={() => setSelectedStatus(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </Group>

      {filteredOpenings.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
          {filteredOpenings.map((opening) => (
            <Card
              key={opening.id}
              radius="lg"
              shadow="sm"
              p="md"
              style={{ position: "relative" }}
            >
              {/* ⋮ menu */}
              {isAdmin && (
                <div
                  style={{ position: "absolute", top: 12, right: 12 }}
                  onClick={(e) => e.preventDefault()}
                >
                  <Menu position="bottom-end" withArrow shadow="sm">
                    <Menu.Target>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        aria-label="Opening options"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DotsVertical width={16} height={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item>Edit</Menu.Item>
                      <Menu.Item>
                        {opening.status === "open"
                          ? "Close position"
                          : "Open position"}
                      </Menu.Item>
                      <Menu.Item color="red">Delete</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </div>
              )}

              <Link
                href={`/protected/org/${orgId}/opening/${opening.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {/* Org initial as avatar */}
                <Avatar radius="md" size={48} color="gray">
                  {(opening.title || orgName || "O").charAt(0).toUpperCase()}
                </Avatar>

                <Text fw={700} size="md" mt="sm" lineClamp={2}>
                  {opening.title || "Untitled Opening"}
                </Text>

                <Text size="sm" c="dimmed" mb="xs">
                  {orgName}
                </Text>

                <OpeningStatusBadge
                  status={opening.status ?? "draft"}
                  size="sm"
                />

                <Text size="xs" c="dimmed" mt="xs">
                  {opening.closes_at
                    ? `Due ${formatDate(opening.closes_at)}`
                    : "No deadline"}
                </Text>
              </Link>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Text size="sm" c="dimmed" ta="center" py="lg">
          No {getOpeningStatusLabel(selectedStatus).toLowerCase()} positions.
        </Text>
      )}
    </Stack>
  );
}
