"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "@untitled-ui/icons-react";
import {
  Avatar,
  Badge,
  Box,
  Card,
  Group,
  Loader,
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
import { Tables } from "@/types/app";
import { logger } from "@/lib/logger";

interface ApplicationsViewProps {
  initialApplications: ApplicationWithDetails[];
}

export function ApplicationsView({
  initialApplications,
}: ApplicationsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    openings: (Tables<"openings"> & { org: Pick<Tables<"orgs">, "name"> })[];
    orgs: Tables<"orgs">[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const response = await fetch(
            `/api/search?query=${encodeURIComponent(searchQuery)}`,
            { signal: controller.signal },
          );
          if (!response.ok) throw new Error("Search failed");
          const data = await response.json();
          setSearchResults(data);
        } catch (error: unknown) {
          if (error instanceof Error && error.name !== "AbortError") {
            logger.error("Failed to fetch search results:", error);
          }
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults(null);
      }
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [searchQuery]);

  const activeApplications = initialApplications.filter(
    (app) => app.status !== "Rejected" && app.status !== "Accepted Offer",
  );

  const pastApplications = initialApplications.filter(
    (app) => app.status === "Rejected",
  );

  return (
    <Stack gap="xl" style={{ width: "100%" }}>
      {/* Search */}
      <TextInput
        placeholder="Search organizations, positions..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.currentTarget.value)}
        leftSection={<SearchMd width={16} height={16} />}
        size="md"
      />

      {searchQuery ? (
        // Search Results
        <Stack gap="xl">
          {isSearching ? (
            <Box ta="center" py="xl">
              <Loader size="sm" />
            </Box>
          ) : (
            <>
              {searchResults?.orgs && searchResults.orgs.length > 0 && (
                <Stack gap="md">
                  <Text fw={600} size="lg">
                    Organizations
                  </Text>
                  <SimpleGrid
                    cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
                    spacing="md"
                  >
                    {searchResults.orgs.map((org) => (
                      <Link
                        key={org.id}
                        href={`/protected/org/${org.id}`}
                        style={{
                          textDecoration: "none",
                          display: "block",
                          height: "100%",
                        }}
                      >
                        <Card
                          withBorder
                          radius="md"
                          p="md"
                          style={{ height: "100%" }}
                        >
                          <Group gap="md" mb="sm">
                            <Avatar color="blue" radius="xl" size={40}>
                              {org.name.charAt(0)}
                            </Avatar>
                            <Text fw={700} size="sm" lh={1.2}>
                              {org.name}
                            </Text>
                          </Group>
                          <Text size="sm" c="dimmed" lineClamp={2}>
                            {org.description || "No description provided."}
                          </Text>
                        </Card>
                      </Link>
                    ))}
                  </SimpleGrid>
                </Stack>
              )}

              {searchResults?.openings && searchResults.openings.length > 0 && (
                <Stack gap="md">
                  <Text fw={600} size="lg">
                    Openings
                  </Text>
                  <SimpleGrid
                    cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
                    spacing="md"
                  >
                    {searchResults.openings.map((opening) => (
                      <Card
                        key={opening.id}
                        withBorder
                        radius="md"
                        p="md"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                        }}
                      >
                        <Group justify="space-between" mb="sm">
                          <Box
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: "var(--mantine-radius-md)",
                              background: "#db2777",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: 700,
                              fontSize: 18,
                            }}
                          >
                            {opening.org?.name?.charAt(0) || "?"}
                          </Box>
                          <Badge variant="light" color="green" size="sm">
                            Open
                          </Badge>
                        </Group>

                        <Text fw={700} size="sm" lh={1.2} mb={4}>
                          {opening.title}
                        </Text>
                        <Text size="sm" c="dimmed" mb="auto">
                          {opening.org?.name}
                        </Text>

                        <Group
                          justify="space-between"
                          mt="md"
                          pt="xs"
                          style={{
                            borderTop: "1px solid var(--mantine-color-gray-2)",
                          }}
                        >
                          <Text size="xs" c="dimmed">
                            {opening.closes_at
                              ? `Due ${new Date(
                                  opening.closes_at,
                                ).toLocaleDateString("en-US", {
                                  month: "2-digit",
                                  day: "2-digit",
                                  year: "numeric",
                                })}`
                              : "No deadline"}
                          </Text>
                          {opening.application_link && (
                            <Link
                              href={opening.application_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "var(--mantine-color-gray-5)" }}
                            >
                              <ChevronRight width={16} height={16} />
                            </Link>
                          )}
                        </Group>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Stack>
              )}

              {!searchResults?.orgs?.length &&
                !searchResults?.openings?.length && (
                  <Text c="dimmed" ta="center" py="xl">
                    No results found for &quot;{searchQuery}&quot;.
                  </Text>
                )}
            </>
          )}
        </Stack>
      ) : (
        // My Applications view
        <Stack gap="xl">
          <Stack gap="md">
            <Text fw={600} size="lg">
              My Applications
            </Text>
            {activeApplications.length === 0 ? (
              <Text c="dimmed">No active applications found.</Text>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                {activeApplications.map((app) => (
                  <ApplicationCard key={app.id} application={app} />
                ))}
              </SimpleGrid>
            )}
          </Stack>

          {pastApplications.length > 0 && (
            <Stack gap="md">
              <Text fw={600} size="lg">
                Past Applications
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                {pastApplications.map((app) => (
                  <ApplicationCard key={app.id} application={app} />
                ))}
              </SimpleGrid>
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  );
}
