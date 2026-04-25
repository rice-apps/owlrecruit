"use client";

import { useEffect, useState } from "react";
import {
  SimpleGrid,
  Stack,
  Text,
  Title,
  Loader,
  Center,
  Alert,
} from "@mantine/core";
import { AlertCircle } from "@untitled-ui/icons-react";
import ApplicationCard from "./components/ApplicationCard";
import { SearchInput } from "@/components/SearchInput";
import { logger } from "@/lib/logger";
import type { Enums } from "@/types/supabase";

interface Application {
  org_id: string;
  opening_id: string;
  status: Enums<"status"> | null;
  created_at: string | null;
  opening_title?: string;
  org_name?: string;
  closes_at?: string | null;
  opening_status?: Enums<"opening_status">;
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchApplications() {
      try {
        setLoading(true);
        const res = await fetch("/api/user/org-status");
        if (!res.ok) throw new Error("Failed to fetch applications");
        const json = await res.json();
        setApplications(json.applications ?? []);
      } catch (err) {
        logger.error("Error fetching applications:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchApplications();
  }, []);

  const filtered = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
    return (
      app.opening_title?.toLowerCase().includes(q) ||
      app.org_name?.toLowerCase().includes(q)
    );
  });

  const active = filtered.filter((app) => {
    if (
      app.status === "Rejected" ||
      app.status === "Accepted Offer" ||
      app.opening_status === "closed"
    )
      return false;
    return !app.closes_at || new Date(app.closes_at) >= new Date();
  });

  const past = filtered.filter((app) => {
    if (
      app.status === "Rejected" ||
      app.status === "Accepted Offer" ||
      app.opening_status === "closed"
    )
      return true;
    return app.closes_at != null && new Date(app.closes_at) < new Date();
  });

  return (
    <Stack gap="lg">
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search organizations, positions..."
      />

      {loading && (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      )}

      {error && (
        <Alert
          color="red"
          title="Error loading applications"
          icon={<AlertCircle width={16} height={16} />}
        >
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <Stack gap="xl">
          <Stack gap="md">
            <Title order={3}>My Applications</Title>
            {active.length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                {active.map((app) => (
                  <ApplicationCard
                    key={`${app.opening_id}-${app.created_at}`}
                    application={app}
                  />
                ))}
              </SimpleGrid>
            ) : (
              <Text c="dimmed">
                {searchQuery
                  ? "No active applications match your search."
                  : "No active applications found."}
              </Text>
            )}
          </Stack>

          {past.length > 0 && (
            <Stack gap="md">
              <Title order={3}>Past Applications</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                {past.map((app) => (
                  <ApplicationCard
                    key={`${app.opening_id}-${app.created_at}`}
                    application={app}
                  />
                ))}
              </SimpleGrid>
            </Stack>
          )}

          {active.length === 0 && past.length === 0 && !searchQuery && (
            <Center py="xl">
              <Text c="dimmed">
                You haven&apos;t submitted any applications yet.
              </Text>
            </Center>
          )}
        </Stack>
      )}
    </Stack>
  );
}
