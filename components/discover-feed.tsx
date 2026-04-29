"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  SimpleGrid,
  Card,
  Text,
  Avatar,
  Loader,
  Center,
  Stack,
  Box,
  TextInput,
} from "@mantine/core";
import { SearchMd } from "@untitled-ui/icons-react";
import { ApplicationStatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import { OpeningStatus } from "@/types/app";

interface Opening {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  status: string;
  org_id: string;
  application_link: string | null;
  closes_at: string | null;
  org: { name: string; logo_url?: string | null };
  applicationStatus: string | null;
}

export function DiscoverFeed() {
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchOpenings() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          statuses: OpeningStatus.OPEN,
          datePosted: "all",
          deadline: "all",
          sort: "recent",
        });
        const res = await fetch(`/api/openings?${params}`);
        if (!res.ok) throw new Error("Failed to fetch openings");
        const json = await res.json();
        setOpenings(json.data ?? json);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    fetchOpenings();
  }, []);

  const filtered = openings.filter(
    (o) =>
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.org.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Stack gap="lg">
      {/* Dark banner */}
      <Box
        bg="dark.6"
        p="xl"
        style={{ borderRadius: "var(--mantine-radius-xl)" }}
      >
        <Text c="white" fw={700} size="xl" mb={4}>
          Discover
        </Text>
        <Text c="dark.2" size="sm" mb="md">
          Find open positions across organizations.
        </Text>
        <TextInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          placeholder="Search clubs, roles..."
          radius="xl"
          leftSection={<SearchMd width={16} height={16} />}
          styles={{
            input: { background: "white" },
          }}
        />
      </Box>

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
            <Link
              key={opening.id}
              href={`/apply/${opening.id}`}
              style={{ textDecoration: "none" }}
            >
              <Card
                radius="lg"
                shadow="sm"
                p="md"
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                }}
              >
                {/* Org logo */}
                <Avatar
                  src={opening.org.logo_url || undefined}
                  radius="md"
                  size={48}
                  color="initials"
                  name={opening.org.name}
                />

                <Text fw={700} size="md" mt="sm" lh={1.3}>
                  {opening.title}
                </Text>
                <Text size="sm" c="dimmed">
                  {opening.org.name}
                </Text>

                {opening.applicationStatus && (
                  <ApplicationStatusBadge
                    status={opening.applicationStatus}
                    size="xs"
                  />
                )}

                <Text
                  size="xs"
                  c="dimmed"
                  mt="xs"
                  style={{ marginTop: "auto" }}
                >
                  {opening.closes_at
                    ? `Due ${formatDate(opening.closes_at)}`
                    : "No deadline"}
                </Text>
              </Card>
            </Link>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
