"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Avatar,
  Button,
  Card,
  Group,
  Loader,
  MultiSelect,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { createClient } from "@/lib/supabase/client";
import type { ApplicationStatus } from "@/types/app";
import { logger } from "@/lib/logger";
import { getApplicationStatusColor } from "@/lib/status";

interface Applicant {
  id: string;
  name: string;
  status: ApplicationStatus;
}

interface Reviewer {
  id: string;
  name: string | null;
  email: string;
}

interface EligibleReviewer {
  id: string;
  user_id: string;
  role: string;
  users:
    | { id: string; name: string | null; email: string }
    | { id: string; name: string | null; email: string }[]
    | null;
}

interface OverviewTabProps {
  applicants: Applicant[];
  orgId: string;
  openingId: string;
  openingStatus: string | null;
  applicationLink: string | null;
}

const STATUS_ORDER: ApplicationStatus[] = [
  "Applied",
  "Interviewing",
  "Offer",
  "Accepted Offer",
  "Rejected",
  "No Status",
];

export function OverviewTab({
  applicants,
  orgId,
  openingId,
  openingStatus,
  applicationLink,
}: OverviewTabProps) {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loadingReviewers, setLoadingReviewers] = useState(true);
  const [isEditingReviewers, setIsEditingReviewers] = useState(false);
  const [eligibleReviewers, setEligibleReviewers] = useState<
    EligibleReviewer[]
  >([]);
  const [selectedReviewerIds, setSelectedReviewerIds] = useState<string[]>([]);
  const [savingReviewers, setSavingReviewers] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const fetchReviewers = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: opening, error: openingError } = await supabase
        .from("openings")
        .select("reviewer_ids")
        .eq("id", openingId)
        .eq("org_id", orgId)
        .single();

      if (openingError) {
        logger.error("Failed to fetch opening reviewers:", openingError);
        return;
      }

      const reviewerIds = Array.isArray(opening?.reviewer_ids)
        ? opening.reviewer_ids.filter(
            (id: unknown): id is string => typeof id === "string",
          )
        : [];

      if (reviewerIds.length === 0) {
        setReviewers([]);
        return;
      }

      const { data: users, error } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", reviewerIds);

      if (error) {
        logger.error("Failed to fetch reviewers:", error);
      } else if (users) {
        const usersById = new Map(users.map((user) => [user.id, user]));
        const orderedReviewers = reviewerIds
          .map((id) => usersById.get(id))
          .filter((user): user is Reviewer => Boolean(user));
        setReviewers(orderedReviewers);
      }
    } catch (error) {
      logger.error("Failed to fetch reviewers:", error);
    } finally {
      setLoadingReviewers(false);
    }
  }, [orgId, openingId]);

  useEffect(() => {
    fetchReviewers();
  }, [fetchReviewers]);

  const handleEditReviewers = async () => {
    setSelectedReviewerIds(reviewers.map((r) => r.id));
    setIsEditingReviewers(true);

    if (eligibleReviewers.length > 0) return;

    try {
      const res = await fetch(`/api/org/${orgId}/members?role=admin,reviewer`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch eligible reviewers");
      const json = await res.json();
      setEligibleReviewers(json.data ?? json);
    } catch (error) {
      logger.error("Failed to fetch eligible reviewers:", error);
    }
  };

  const handleSaveReviewers = async () => {
    try {
      setSavingReviewers(true);
      const res = await fetch(`/api/org/${orgId}/openings/${openingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewer_ids: selectedReviewerIds }),
      });
      if (!res.ok) throw new Error("Failed to save reviewers");
      setIsEditingReviewers(false);
      setLoadingReviewers(true);
      await fetchReviewers();
    } catch (error) {
      logger.error("Failed to save reviewers:", error);
    } finally {
      setSavingReviewers(false);
    }
  };

  const totalSubmissions = applicants.length;

  const acceptedCount = useMemo(
    () => applicants.filter((a) => a.status === "Accepted Offer").length,
    [applicants],
  );

  const statusBreakdown = useMemo(() => {
    const counts: Partial<Record<ApplicationStatus, number>> = {};
    for (const applicant of applicants) {
      counts[applicant.status] = (counts[applicant.status] || 0) + 1;
    }
    return STATUS_ORDER.filter((status) => counts[status]).map((status) => ({
      status,
      count: counts[status]!,
    }));
  }, [applicants]);

  const maxCount = useMemo(
    () => Math.max(...statusBreakdown.map((s) => s.count), 1),
    [statusBreakdown],
  );

  const reviewerSelectData = eligibleReviewers.map((r) => {
    const u = Array.isArray(r.users) ? r.users[0] : r.users;
    return {
      value: r.user_id,
      label: u?.name || u?.email || r.user_id,
    };
  });

  const applyUrl = applicationLink || `${origin}/apply/${openingId}`;

  return (
    <Stack gap="lg" py="lg">
      {/* Stats */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <Card withBorder radius="md" p="md">
          <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb="xs">
            Total Submissions
          </Text>
          <Text size="2rem" fw={700}>
            {totalSubmissions}
          </Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb="xs">
            Accepted
          </Text>
          <Text size="2rem" fw={700}>
            {acceptedCount}
          </Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb="xs">
            Breakdown
          </Text>
          {statusBreakdown.length > 0 ? (
            <Group gap="xs" align="flex-end" style={{ height: 64 }}>
              {statusBreakdown.map(({ status, count }) => (
                <div
                  key={status}
                  title={`${status}: ${count}`}
                  style={{
                    height: `${(count / maxCount) * 100}%`,
                    minHeight: 8,
                    width: 24,
                    borderRadius: 4,
                    backgroundColor: `var(--mantine-color-${getApplicationStatusColor(status)}-5)`,
                  }}
                />
              ))}
            </Group>
          ) : (
            <Text size="sm" c="dimmed">
              No data yet
            </Text>
          )}
        </Card>
      </SimpleGrid>

      {/* Application link */}
      {openingStatus === "open" && (
        <Card withBorder radius="md" p="md">
          <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb="xs">
            Application Form Link
          </Text>
          <Group gap="xs">
            <TextInput
              value={applyUrl}
              readOnly
              style={{ flex: 1 }}
              styles={{ input: { fontFamily: "monospace", fontSize: 13 } }}
            />
            <Button
              variant="light"
              size="sm"
              onClick={() => navigator.clipboard.writeText(applyUrl)}
            >
              Copy
            </Button>
          </Group>
        </Card>
      )}

      {/* Rubric settings link */}
      <Link
        href={`/protected/org/${orgId}/opening/${openingId}/rubric`}
        style={{
          color: "var(--mantine-color-owlPurple-6)",
          fontSize: 14,
          textDecoration: "none",
        }}
      >
        Rubric Settings →
      </Link>

      {/* Assigned Reviewers */}
      <Stack gap="sm">
        <Group gap="md" align="center">
          <Text
            fw={600}
            size="sm"
            tt="uppercase"
            style={{ letterSpacing: "0.05em" }}
          >
            Assigned Reviewers
          </Text>
          {!isEditingReviewers && (
            <Button
              variant="subtle"
              size="xs"
              color="owlPurple"
              onClick={handleEditReviewers}
            >
              Edit
            </Button>
          )}
        </Group>

        {isEditingReviewers && (
          <Card withBorder radius="md" p="md">
            <Stack gap="sm">
              <MultiSelect
                placeholder="Select reviewers..."
                data={reviewerSelectData}
                value={selectedReviewerIds}
                onChange={setSelectedReviewerIds}
                searchable
                clearable
              />
              <Group justify="flex-end" gap="xs">
                <Button
                  variant="default"
                  size="xs"
                  disabled={savingReviewers}
                  onClick={() => setIsEditingReviewers(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="xs"
                  loading={savingReviewers}
                  onClick={handleSaveReviewers}
                >
                  Save
                </Button>
              </Group>
            </Stack>
          </Card>
        )}

        {loadingReviewers ? (
          <Loader size="sm" />
        ) : reviewers.length > 0 ? (
          <Group gap="sm" wrap="wrap">
            {reviewers.map((reviewer) => {
              const displayName = reviewer.name || reviewer.email || "Reviewer";
              const initials = displayName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();
              return (
                <Card key={reviewer.id} withBorder radius="md" p="sm">
                  <Group gap="sm">
                    <Avatar size={36} color="owlPurple" radius="md">
                      {initials}
                    </Avatar>
                    <Text size="sm" fw={500}>
                      {displayName}
                    </Text>
                  </Group>
                </Card>
              );
            })}
          </Group>
        ) : (
          <Text size="sm" c="dimmed">
            No reviewers assigned yet
          </Text>
        )}
      </Stack>
    </Stack>
  );
}
