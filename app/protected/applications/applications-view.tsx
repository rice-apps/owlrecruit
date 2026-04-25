"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { SearchMd } from "@untitled-ui/icons-react";
import {
  ApplicationCard,
  ApplicationWithDetails,
} from "@/components/application-card";

interface ApplicationsViewProps {
  initialApplications: ApplicationWithDetails[];
}

export function ApplicationsView({
  initialApplications,
}: ApplicationsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeToggle, setActiveToggle] = useState<"active" | "inactive">(
    "active",
  );

  const activeApplications = initialApplications.filter(
    (app) => app.status !== "Rejected" && app.status !== "Accepted Offer",
  );

  const pastApplications = initialApplications.filter(
    (app) => app.status === "Rejected",
  );

  const shownApplications =
    activeToggle === "active" ? activeApplications : pastApplications;

  const filteredApplications = shownApplications.filter((app) => {
    const q = searchQuery.toLowerCase();
    return (
      app.opening.title.toLowerCase().includes(q) ||
      app.opening.org.name.toLowerCase().includes(q)
    );
  });

  return (
    <Stack gap="lg" style={{ width: "100%" }}>
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          placeholder="Search positions, organizations..."
          radius="xl"
          leftSection={<SearchMd width={16} height={16} />}
          styles={{
            input: { background: "white" },
          }}
        />
      </Box>

      {/* Active / Inactive toggle */}
      <Group gap="xs">
        <Button
          radius="xl"
          color={activeToggle === "active" ? "dark" : "gray"}
          variant={activeToggle === "active" ? "filled" : "outline"}
          onClick={() => setActiveToggle("active")}
        >
          Active
        </Button>
        <Button
          radius="xl"
          color={activeToggle === "inactive" ? "dark" : "gray"}
          variant={activeToggle === "inactive" ? "filled" : "outline"}
          onClick={() => setActiveToggle("inactive")}
        >
          Inactive
        </Button>
      </Group>

      {/* Applications grid */}
      {filteredApplications.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No applications found.
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
          {filteredApplications.map((app) => (
            <Link
              key={app.id}
              href={`/protected/org/${(app.opening as ApplicationWithDetails["opening"] & { org_id?: string }).org_id ?? ""}`}
              style={{ textDecoration: "none", height: "100%" }}
            >
              <ApplicationCard application={app} />
            </Link>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
