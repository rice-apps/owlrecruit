"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  SimpleGrid,
  Card,
  Text,
  Group,
  Badge,
  Avatar,
  Loader,
  Center,
  Stack,
  Button,
  Box,
  Anchor,
} from "@mantine/core";
import { FilterLines, LinkExternal01 } from "@untitled-ui/icons-react";
import { SearchInput } from "@/components/SearchInput";
import { FilterDrawer, type FilterState } from "@/components/filter-dialog";
import { formatDate } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface Opening {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  status: string;
  org_id: string;
  application_link: string | null;
  closes_at: string | null;
  org: { name: string };
}

function isValidUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function DiscoverFeed() {
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    statuses: ["open"],
    datePosted: "all",
    deadline: "all",
    sort: "recent",
  });

  useEffect(() => {
    async function fetchOpenings() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          statuses: filters.statuses.join(","),
          datePosted: filters.datePosted,
          deadline: filters.deadline,
          sort: filters.sort,
        });
        const res = await fetch(`/api/openings?${params}`);
        if (!res.ok) throw new Error("Failed to fetch openings");
        const json = await res.json();
        setOpenings(json.data ?? json);
      } catch (error) {
        logger.error("Error fetching openings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOpenings();
  }, [filters]);

  const filtered = openings.filter(
    (o) =>
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.org.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Stack gap="lg">
      <Group>
        <Box style={{ flex: 1 }}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search organizations, positions..."
          />
        </Box>
        <Button
          variant="default"
          leftSection={<FilterLines width={16} height={16} />}
          onClick={() => setFilterOpen(true)}
        >
          Filter
        </Button>
      </Group>

      <FilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onApply={setFilters}
      />

      <Text fw={600} size="lg">
        Recent Postings
      </Text>

      {loading ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : filtered.length === 0 ? (
        <Center py="xl">
          <Text c="dimmed">No open roles found.</Text>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
          {filtered.map((opening) => (
            <Card
              key={opening.id}
              padding={0}
              radius="md"
              withBorder
              shadow="sm"
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
                  color="owlPurple"
                  fw={700}
                >
                  {opening.org.name.charAt(0)}
                </Avatar>
              </Box>

              {/* Card body */}
              <Stack gap={4} p="md" pt={28} style={{ flex: 1 }}>
                <Text fw={700} size="md" lh={1.3}>
                  {opening.title}
                </Text>
                <Text size="sm" c="dimmed">
                  {opening.org.name}
                </Text>
                <Badge
                  color="green"
                  variant="light"
                  size="sm"
                  mt={4}
                  w="fit-content"
                >
                  Open
                </Badge>
              </Stack>

              {/* Footer */}
              <Box
                px="md"
                py="xs"
                style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}
              >
                <Group justify="space-between" align="center">
                  <Text size="xs" c="dimmed">
                    {opening.closes_at
                      ? `Due ${formatDate(opening.closes_at)}`
                      : "No deadline"}
                  </Text>
                  {isValidUrl(opening.application_link) && (
                    <Anchor
                      href={opening.application_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      component={Link}
                    >
                      <LinkExternal01 width={14} height={14} />
                    </Anchor>
                  )}
                </Group>
              </Box>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
