"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Center,
  Alert,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { AlertCircle, SearchMd } from "@untitled-ui/icons-react";
import {
  ApplicationCard,
  type ApplicationWithDetails,
} from "@/components/application-card";
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

function toCardProps(app: Application): ApplicationWithDetails {
  return {
    id: app.opening_id,
    org_id: app.org_id,
    status: app.status,
    created_at: app.created_at,
    opening: {
      title: app.opening_title ?? "Unknown Position",
      closes_at: app.closes_at ?? null,
      org: {
        name: app.org_name ?? "Unknown Organization",
        logo_url: null,
      },
    },
  } as unknown as ApplicationWithDetails;
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");

  useEffect(() => {
    async function fetchApplications() {
      try {
        setLoading(true);
        const res = await fetch("/api/user/org-status");
        if (!res.ok) throw new Error("Failed to fetch applications");
        const json = await res.json();
        setApplications(json.applications ?? []);
      } catch (err) {
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

  const inactive = filtered.filter((app) => {
    if (
      app.status === "Rejected" ||
      app.status === "Accepted Offer" ||
      app.opening_status === "closed"
    )
      return true;
    return app.closes_at != null && new Date(app.closes_at) < new Date();
  });

  const shown = activeTab === "active" ? active : inactive;

  return (
    <Stack gap="lg">
      {/* Dark banner */}
      <Box
        bg="dark.6"
        p="xl"
        style={{ borderRadius: "var(--mantine-radius-xl)" }}
      >
        <Text c="white" fw={700} size="xl" mb={4}>
          My Applications
        </Text>
        <Text c="dark.2" size="sm" mb="md">
          Track the status of your submissions.
        </Text>
        <TextInput
          radius="xl"
          placeholder="Search applications"
          leftSection={<SearchMd width={16} height={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />
      </Box>

      {/* Active / Inactive toggle */}
      <Group gap="xs">
        <Button
          radius="xl"
          size="sm"
          variant={activeTab === "active" ? "filled" : "outline"}
          color={activeTab === "active" ? "dark" : "gray"}
          onClick={() => setActiveTab("active")}
        >
          Active
        </Button>
        <Button
          radius="xl"
          size="sm"
          variant={activeTab === "inactive" ? "filled" : "outline"}
          color={activeTab === "inactive" ? "dark" : "gray"}
          onClick={() => setActiveTab("inactive")}
        >
          Inactive
        </Button>
      </Group>

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
        <>
          {shown.length > 0 ? (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
              {shown.map((app) => (
                <ApplicationCard
                  key={`${app.opening_id}-${app.created_at}`}
                  application={toCardProps(app)}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Center py="xl">
              <Text c="dimmed">
                {searchQuery
                  ? "No applications match your search."
                  : `No ${activeTab} applications found.`}
              </Text>
            </Center>
          )}
        </>
      )}
    </Stack>
  );
}
