"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Text,
} from "@mantine/core";
import { Json } from "@/types/supabase";
import { Breadcrumb } from "@/components/Breadcrumb";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { ApplicantTabs } from "./components/ApplicantTabs";
import { CommentsSidebar } from "@/app/protected/org/[orgId]/opening/[openingId]/applicant/[applicantId]/components/comments-sidebar";
import { InterviewTab } from "@/app/protected/org/[orgId]/opening/[openingId]/applicant/[applicantId]/components/InterviewTab";
import { ApplicationStatusBadge } from "@/components/StatusBadge";
import type { ApplicationStatus } from "@/types/app";
import {
  computeRubricSummary,
  type ReviewerFeedbackPreview,
  type RubricCriterion,
  type RubricSummaryMetrics,
  SummaryTab,
} from "@/app/protected/org/[orgId]/opening/[openingId]/applicant/[applicantId]/components/SummaryTab";

interface ApplicationData {
  form_responses: Json;
  resume_url: string | null;
  status: ApplicationStatus;
}

interface ReviewerScoreSummary {
  id?: string;
  reviewerId?: string;
  reviewerName?: string | null;
  scoreSkills?: Record<string, number> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface ReviewsSummaryResponse {
  summary?: {
    rubric?: RubricCriterion[];
    reviewerScores?: ReviewerScoreSummary[];
    resumeUrl?: string | null;
  } | null;
}

interface SummaryTabState {
  rubricSummary: RubricSummaryMetrics | null;
  reviewerFeedback: ReviewerFeedbackPreview[];
  resumeUrl: string | null;
}

interface FormResponse {
  Name?: string;
  Email?: string;
  Major?: string;
  [key: string]: string | number | boolean | null | undefined;
}

const UNKNOWN_REVIEWER = "Unknown Reviewer";

const parseScoreValue = (value: unknown, maxScore: number): number | null => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;
  if (numeric < 0 || numeric > maxScore) return null;
  return numeric;
};

function ResumeViewer({ resumeUrl }: { resumeUrl: string | null }) {
  if (!resumeUrl) {
    return (
      <Text c="dimmed" size="sm">
        No resume available
      </Text>
    );
  }

  const getPreviewUrl = (url: string): string => {
    let fileId = "";
    if (url.includes("/open?id=")) {
      fileId = url.split("/open?id=")[1].split("&")[0];
    } else if (url.includes("/file/d/")) {
      fileId = url.split("/file/d/")[1].split("/")[0];
    } else if (url.includes("?id=")) {
      fileId = url.split("?id=")[1].split("&")[0];
    }
    return `https://drive.google.com/file/d/${fileId}/preview`;
  };

  return (
    <Box style={{ width: "100%", height: 800 }}>
      <iframe
        src={getPreviewUrl(resumeUrl)}
        style={{
          width: "100%",
          height: "100%",
          border: "1px solid var(--mantine-color-gray-2)",
          borderRadius: "var(--mantine-radius-md)",
        }}
        title="Applicant Resume"
        allow="autoplay"
      />
    </Box>
  );
}

export default function ApplicantReviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { orgId, openingId, applicantId } = params as {
    orgId: string;
    openingId: string;
    applicantId: string;
  };

  const tab = searchParams.get("tab") || "submission";
  const showReviewSidebar = tab !== "summary" && tab !== "interview";
  const [applicationData, setApplicationData] =
    useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState<string>("");
  const [openingTitle, setOpeningTitle] = useState<string>("");
  const [summaryData, setSummaryData] = useState<SummaryTabState | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryFetchAttempted, setSummaryFetchAttempted] = useState(false);

  useEffect(() => {
    async function fetchApplicationData() {
      try {
        const supabase = createClient();
        const [{ data, error }, { data: orgData }, { data: openingData }] =
          await Promise.all([
            supabase
              .from("applications")
              .select("form_responses, resume_url, status")
              .eq("id", applicantId)
              .single(),
            supabase.from("orgs").select("name").eq("id", orgId).single(),
            supabase
              .from("openings")
              .select("title")
              .eq("id", openingId)
              .single(),
          ]);

        if (error) throw error;
        setApplicationData(data);
        if (orgData) setOrgName(orgData.name);
        if (openingData) setOpeningTitle(openingData.title);
      } catch (err) {
        logger.error("Error fetching application data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchApplicationData();
  }, [applicantId, orgId, openingId]);

  useEffect(() => {
    setSummaryData(null);
    setSummaryError(null);
    setSummaryFetchAttempted(false);
    setSummaryLoading(false);
  }, [applicantId, orgId]);

  useEffect(() => {
    if (tab !== "summary" || summaryFetchAttempted) return;

    const controller = new AbortController();
    let isMounted = true;

    async function loadSummaryData() {
      setSummaryLoading(true);
      setSummaryError(null);

      try {
        const response = await fetch(
          `/api/org/${orgId}/applications/${applicantId}/reviews`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch summary (${response.status})`);
        }

        const payload: ReviewsSummaryResponse = await response.json();

        if (!isMounted) return;

        const rubricSummary = payload.summary?.rubric
          ? computeRubricSummary(
              payload.summary.rubric,
              (payload.summary.reviewerScores ?? []).map(
                (review) => review?.scoreSkills ?? {},
              ),
            )
          : null;

        const rubricDefinition = payload.summary?.rubric ?? [];
        const reviewerFeedback: ReviewerFeedbackPreview[] = (
          payload.summary?.reviewerScores ?? []
        ).flatMap((review) => {
          const scoreSkills = review?.scoreSkills ?? {};
          const rubricScores = rubricDefinition.flatMap((criterion) => {
            const parsedValue = parseScoreValue(
              scoreSkills[criterion.name],
              criterion.max_val,
            );
            if (parsedValue === null) return [];
            return [
              {
                name: criterion.name,
                score: parsedValue,
                maxScore: criterion.max_val,
              },
            ];
          });

          if (rubricScores.length === 0) return [];

          const totalScore = rubricScores.reduce((sum, s) => sum + s.score, 0);
          const totalMaxScore = rubricScores.reduce(
            (sum, s) => sum + s.maxScore,
            0,
          );

          return [
            {
              id:
                review.id ??
                review.reviewerId ??
                `${review.reviewerName ?? UNKNOWN_REVIEWER}-${review.createdAt ?? ""}`,
              author:
                review.reviewerName?.trim() &&
                review.reviewerName.trim().length > 0
                  ? review.reviewerName.trim()
                  : UNKNOWN_REVIEWER,
              role: null,
              summary: null,
              submittedAt: review.updatedAt ?? review.createdAt ?? null,
              score: totalScore,
              maxScore: totalMaxScore,
              rubricScores,
            } satisfies ReviewerFeedbackPreview,
          ];
        });

        setSummaryData({
          rubricSummary,
          reviewerFeedback,
          resumeUrl: payload.summary?.resumeUrl ?? null,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        logger.error("Error fetching summary data:", error);
        if (isMounted)
          setSummaryError("Unable to load summary data. Please try again.");
      } finally {
        if (isMounted) {
          setSummaryFetchAttempted(true);
          setSummaryLoading(false);
        }
      }
    }

    loadSummaryData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [tab, orgId, applicantId, summaryFetchAttempted]);

  const formData =
    typeof applicationData?.form_responses === "object" &&
    applicationData?.form_responses
      ? (applicationData.form_responses as FormResponse)
      : {};

  const toDisplayString = (value: unknown): string | undefined => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    return undefined;
  };

  const applicantName =
    toDisplayString(formData["Name"]) ||
    toDisplayString(formData["name"]) ||
    "Unknown Applicant";
  const applicantEmail =
    toDisplayString(formData["Email"]) ||
    toDisplayString(formData["email"]) ||
    "Unknown Email";
  const applicantMajor =
    toDisplayString(formData["Major"]) ||
    toDisplayString(formData["major"]) ||
    "Unknown Major";

  const handleSummaryRetry = () => {
    setSummaryData(null);
    setSummaryError(null);
    setSummaryFetchAttempted(false);
  };

  const renderTabContent = () => {
    switch (tab) {
      case "submission":
        return (
          <Stack gap="sm">
            {applicationData?.form_responses &&
              typeof applicationData.form_responses === "object" &&
              !Array.isArray(applicationData.form_responses) &&
              Object.entries(applicationData.form_responses).map(
                ([key, value]) => (
                  <Box
                    key={key}
                    pb="sm"
                    style={{
                      borderBottom: "1px solid var(--mantine-color-gray-2)",
                    }}
                  >
                    <Text fw={600} mb={2}>
                      {key}
                    </Text>
                    <Text c="dimmed">
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </Text>
                  </Box>
                ),
              )}
          </Stack>
        );
      case "files":
        return (
          <Stack gap="md">
            {applicationData?.resume_url && (
              <ResumeViewer resumeUrl={applicationData.resume_url} />
            )}
          </Stack>
        );
      case "summary": {
        const summaryResumeUrl =
          summaryData?.resumeUrl ?? applicationData?.resume_url ?? null;

        if (summaryLoading || !summaryFetchAttempted) {
          return (
            <Box ta="center" py="xl">
              <Loader size="sm" />
            </Box>
          );
        }

        if (summaryError) {
          return (
            <Stack gap="md" align="center" py="xl">
              <Alert color="red">{summaryError}</Alert>
              <Button size="sm" onClick={handleSummaryRetry}>
                Retry
              </Button>
            </Stack>
          );
        }

        if (!summaryData) {
          return (
            <Text c="dimmed" size="sm" ta="center" py="xl">
              Summary data is not available yet.
            </Text>
          );
        }

        return (
          <SummaryTab
            applicantName={applicantName}
            applicantEmail={applicantEmail}
            applicantMajor={applicantMajor}
            resumeUrl={summaryResumeUrl}
            rubricSummary={summaryData.rubricSummary}
            reviewerFeedback={summaryData.reviewerFeedback}
          />
        );
      }
      case "interview":
        return <InterviewTab orgId={orgId} applicationId={applicantId} />;
      default:
        return null;
    }
  };

  return (
    <Box
      style={{
        flex: 1,
        width: "100%",
        display: "flex",
        gap: 24,
        height: "calc(100vh - 4rem)",
      }}
    >
      <Stack gap="lg" style={{ flex: 1, overflowY: "auto" }}>
        <Breadcrumb
          items={[
            {
              label: orgName || "Organization",
              href: `/protected/org/${orgId}`,
            },
            {
              label: openingTitle || "Opening",
              href: `/protected/org/${orgId}/opening/${openingId}`,
            },
            { label: applicantName },
          ]}
        />

        <Card radius="lg" shadow="sm" withBorder={false} p="xl">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Group gap="sm" align="center" mb={4}>
                <Text size="xl" fw={700}>
                  {applicantName}
                </Text>
                {applicationData?.status && (
                  <ApplicationStatusBadge status={applicationData.status} />
                )}
              </Group>
              <Group gap="xs" wrap="wrap">
                <Text size="sm" c="dimmed">
                  {applicantEmail}
                </Text>
                <Text c="dimmed">•</Text>
                <Text size="sm" c="dimmed">
                  {applicantMajor}
                </Text>
              </Group>
            </Box>
          </Group>
        </Card>

        {loading ? (
          <Box ta="center" py="xl">
            <Loader size="sm" />
          </Box>
        ) : (
          <Card
            radius="lg"
            shadow="sm"
            withBorder={false}
            p={0}
            style={{ flex: 1 }}
          >
            <Box px="xl" pt="xl" pb="sm">
              <ApplicantTabs />
            </Box>
            <Box px="xl">{renderTabContent()}</Box>
          </Card>
        )}
      </Stack>

      {showReviewSidebar && (
        <CommentsSidebar
          applicantId={applicantId}
          openingId={openingId}
          orgId={orgId}
        />
      )}
    </Box>
  );
}
