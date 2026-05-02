"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
import { Json } from "@/types/database";
import { Breadcrumb } from "@/components/Breadcrumb";
import { createClient } from "@/lib/supabase/client";
import { parseQuestionText } from "@/lib/question-utils";
import { FORM_RESPONSE_KEYS } from "@/lib/application-fields";
import { ApplicantTabs } from "./components/ApplicantTabs";
import { CommentsSidebar } from "@/app/protected/application/[applicationId]/components/comments-sidebar";
import { InterviewTab } from "@/app/protected/application/[applicationId]/components/InterviewTab";
import { ApplicationStatusBadge } from "@/components/StatusBadge";
import type { ApplicationStatus } from "@/types/app";
import {
  computeRubricSummary,
  type ReviewerFeedbackPreview,
  type RubricCriterion,
  type RubricSummaryMetrics,
  SummaryTab,
} from "@/app/protected/application/[applicationId]/components/SummaryTab";

interface ApplicationData {
  form_responses: Json;
  resume_url: string | null;
  status: ApplicationStatus;
  opening_id: string;
}

interface FetchedApplication extends ApplicationData {
  openings:
    | {
        title: string;
        org_id: string;
        orgs: { name: string } | Array<{ name: string }>;
      }
    | Array<{
        title: string;
        org_id: string;
        orgs: { name: string } | Array<{ name: string }>;
      }>;
  applicant: { name: string | null } | Array<{ name: string | null }> | null;
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
  data?: {
    summary?: {
      rubric?: RubricCriterion[];
      reviewerScores?: ReviewerScoreSummary[];
      resumeUrl?: string | null;
    } | null;
  } | null;
}

interface SummaryTabState {
  rubricSummary: RubricSummaryMetrics | null;
  reviewerFeedback: ReviewerFeedbackPreview[];
  resumeUrl: string | null;
}

type FormResponse = Record<
  string,
  string | number | boolean | null | undefined
>;

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

export default function ApplicationReviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const applicationId = params.applicationId as string;

  const tab = searchParams.get("tab") || "summary";
  const [applicationData, setApplicationData] =
    useState<FetchedApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string>("");
  const [openingId, setOpeningId] = useState<string>("");
  const [orgName, setOrgName] = useState<string>("");
  const [openingTitle, setOpeningTitle] = useState<string>("");
  const [summaryData, setSummaryData] = useState<SummaryTabState | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryFetchAttempted, setSummaryFetchAttempted] = useState(false);
  const [orderedQuestionLabels, setOrderedQuestionLabels] = useState<string[]>(
    [],
  );

  useEffect(() => {
    async function fetchApplicationData() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("applications")
          .select(
            "form_responses, resume_url, status, opening_id, openings(title, org_id, orgs(name)), applicant:applicant_id(name)",
          )
          .eq("id", applicationId)
          .single();

        if (error) throw error;
        const fetchedData = data as FetchedApplication;
        setApplicationData(fetchedData);
        setOpeningId(fetchedData.opening_id);
        const opening = Array.isArray(fetchedData.openings)
          ? fetchedData.openings[0]
          : fetchedData.openings;
        setOrgId(opening?.org_id || "");
        const orgs = Array.isArray(opening?.orgs)
          ? opening.orgs[0]
          : opening?.orgs;
        setOrgName(orgs?.name || "Organization");
        setOpeningTitle(opening?.title || "Opening");
      } catch {
        // loading state cleared below
      } finally {
        setLoading(false);
      }
    }
    fetchApplicationData();
  }, [applicationId]);

  useEffect(() => {
    setSummaryData(null);
    setSummaryError(null);
    setSummaryFetchAttempted(false);
    setSummaryLoading(false);
  }, [applicationId]);

  useEffect(() => {
    if (!orgId || !openingId) return;
    fetch(`/api/org/${orgId}/opening/${openingId}/questions`)
      .then((r) => r.json())
      .then((json) => {
        const labels: string[] = (json.questions ?? []).map(
          (q: { question_text: string }) =>
            parseQuestionText(q.question_text).label,
        );
        setOrderedQuestionLabels(labels);
      })
      .catch(() => {});
  }, [orgId, openingId]);

  useEffect(() => {
    if (tab !== "summary" || summaryFetchAttempted || !orgId) return;

    const controller = new AbortController();
    let isMounted = true;

    async function loadSummaryData() {
      setSummaryLoading(true);
      setSummaryError(null);

      try {
        const response = await fetch(
          `/api/org/${orgId}/applications/${applicationId}/reviews`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch summary (${response.status})`);
        }

        const payload: ReviewsSummaryResponse = await response.json();

        if (!isMounted) return;

        const rubricSummary = payload.data?.summary?.rubric
          ? computeRubricSummary(
              payload.data.summary.rubric,
              (payload.data.summary.reviewerScores ?? []).map(
                (review) => review?.scoreSkills ?? {},
              ),
            )
          : null;

        const rubricDefinition = payload.data?.summary?.rubric ?? [];
        const reviewerFeedback: ReviewerFeedbackPreview[] = (
          payload.data?.summary?.reviewerScores ?? []
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
          resumeUrl: payload.data?.summary?.resumeUrl ?? null,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
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
  }, [tab, orgId, applicationId, summaryFetchAttempted]);

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

  const applicantRecord = applicationData?.applicant
    ? Array.isArray(applicationData.applicant)
      ? applicationData.applicant[0]
      : applicationData.applicant
    : null;
  const applicantName =
    toDisplayString(formData[FORM_RESPONSE_KEYS.NAME]) ||
    applicantRecord?.name ||
    "Unknown Applicant";
  const applicantNetId =
    toDisplayString(formData[FORM_RESPONSE_KEYS.NETID]) ?? null;

  const handleSummaryRetry = () => {
    setSummaryData(null);
    setSummaryError(null);
    setSummaryFetchAttempted(false);
  };

  const renderTabContent = () => {
    switch (tab) {
      case "submission": {
        const HIDDEN_KEYS: Set<string> = new Set([
          FORM_RESPONSE_KEYS.NAME,
          FORM_RESPONSE_KEYS.NETID,
        ]);
        const responses =
          applicationData?.form_responses &&
          typeof applicationData.form_responses === "object" &&
          !Array.isArray(applicationData.form_responses)
            ? (applicationData.form_responses as Record<string, unknown>)
            : {};
        const allKeys = Object.keys(responses);
        const displayKeys =
          orderedQuestionLabels.length > 0
            ? [
                ...orderedQuestionLabels.filter(
                  (l) => !HIDDEN_KEYS.has(l) && l in responses,
                ),
                ...allKeys.filter(
                  (k) =>
                    !HIDDEN_KEYS.has(k) && !orderedQuestionLabels.includes(k),
                ),
              ]
            : allKeys.filter((k) => !HIDDEN_KEYS.has(k));
        return (
          <Stack gap="sm">
            {displayKeys.map((key) => {
              const value = responses[key];
              return (
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
                      : String(value ?? "")}
                  </Text>
                </Box>
              );
            })}
          </Stack>
        );
      }
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
            resumeUrl={summaryResumeUrl}
            rubricSummary={summaryData.rubricSummary}
            reviewerFeedback={summaryData.reviewerFeedback}
          />
        );
      }
      case "interview":
        return <InterviewTab orgId={orgId} applicationId={applicationId} />;
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
      <Stack gap="lg" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <Breadcrumb
          items={[
            {
              label: orgName || "Organization",
              href: `/protected/org/${orgId}`,
            },
            {
              label: openingTitle || "Opening",
              href: `/protected/opening/${openingId}`,
            },
            { label: applicantName },
          ]}
        />

        <Card radius="lg" shadow="sm" withBorder={false} p="xl">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Group gap="sm" align="center" mb={applicantNetId ? 4 : 0}>
                <Text size="xl" fw={700}>
                  {applicantName}
                </Text>
                {applicationData?.status && (
                  <ApplicationStatusBadge status={applicationData.status} />
                )}
              </Group>
              {applicantNetId && (
                <Text size="sm" c="dimmed">
                  {applicantNetId}
                </Text>
              )}
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
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <Box px="xl" pt="xl" pb="sm">
              <ApplicantTabs />
            </Box>
            <Box px="xl" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              {renderTabContent()}
            </Box>
          </Card>
        )}
      </Stack>

      <CommentsSidebar
        applicantId={applicationId}
        openingId={openingId}
        orgId={orgId}
      />
    </Box>
  );
}
