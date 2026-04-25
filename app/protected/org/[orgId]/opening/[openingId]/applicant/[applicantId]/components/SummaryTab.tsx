"use client";

import type { ReactNode } from "react";
import {
  Avatar,
  Box,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { formatRelativeTime } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types (previously in summary-metrics.ts / summary-uploads.ts)
// ---------------------------------------------------------------------------

export interface RubricCriterion {
  name: string;
  max_val: number;
}

export interface RubricCriteriaSummary {
  name: string;
  maxVal: number;
  average: number | null;
}

export interface RubricSummaryMetrics {
  hasValidScores: boolean;
  criteria: RubricCriteriaSummary[];
  contributingReviewCount: number;
  overallAverage: number;
  overallMax: number;
}

export function computeRubricSummary(
  rubric: RubricCriterion[],
  allScores: Record<string, unknown>[],
): RubricSummaryMetrics {
  const criteria: RubricCriteriaSummary[] = rubric.map((c) => {
    const scores = allScores
      .map((s) => s[c.name])
      .filter(
        (v): v is number =>
          typeof v === "number" && isFinite(v) && v >= 0 && v <= c.max_val,
      );
    return {
      name: c.name,
      maxVal: c.max_val,
      average:
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null,
    };
  });

  const contributingReviewCount = allScores.filter((s) =>
    rubric.some(
      (c) => typeof s[c.name] === "number" && isFinite(s[c.name] as number),
    ),
  ).length;

  const maxTotal = rubric.reduce((a, b) => a + b.max_val, 0);

  const reviewTotals = allScores
    .map((s) =>
      rubric.reduce((sum, c) => {
        const v = s[c.name];
        const n = typeof v === "number" ? v : NaN;
        return isFinite(n) ? sum + n : sum;
      }, 0),
    )
    .filter((_, i) => {
      const s = allScores[i];
      return rubric.some(
        (c) => typeof s[c.name] === "number" && isFinite(s[c.name] as number),
      );
    });

  const overallAverage =
    reviewTotals.length > 0
      ? reviewTotals.reduce((a, b) => a + b, 0) / reviewTotals.length
      : 0;

  return {
    hasValidScores: contributingReviewCount > 0,
    criteria,
    contributingReviewCount,
    overallAverage,
    overallMax: maxTotal,
  };
}

// ---------------------------------------------------------------------------
// Resume URL normalization (previously in summary-uploads.ts)
// ---------------------------------------------------------------------------

type UploadState =
  | { mode: "preview"; url: string; previewUrl: string }
  | { mode: "link"; url: string }
  | { mode: "empty" };

function normalizeSummaryUpload(resumeUrl: string | null): UploadState {
  if (!resumeUrl) return { mode: "empty" };

  let fileId = "";
  if (resumeUrl.includes("/open?id=")) {
    fileId = resumeUrl.split("/open?id=")[1].split("&")[0];
  } else if (resumeUrl.includes("/file/d/")) {
    fileId = resumeUrl.split("/file/d/")[1].split("/")[0];
  } else if (resumeUrl.includes("?id=")) {
    fileId = resumeUrl.split("?id=")[1].split("&")[0];
  }

  if (fileId) {
    return {
      mode: "preview",
      url: resumeUrl,
      previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
    };
  }

  return { mode: "link", url: resumeUrl };
}

// ---------------------------------------------------------------------------
// Component types
// ---------------------------------------------------------------------------

export interface ReviewerFeedbackPreview {
  id: string;
  author: string;
  role?: string | null;
  summary?: string | null;
  submittedAt?: string | null;
  score?: number | null;
  maxScore?: number | null;
  scoreLabel?: string | null;
  rubricScores?:
    | {
        name: string;
        score: number;
        maxScore: number;
      }[]
    | null;
}

interface SummaryTabProps {
  applicantName: string;
  applicantEmail: string;
  applicantMajor: string;
  resumeUrl: string | null;
  rubricSummary?: RubricSummaryMetrics | null;
  reviewerFeedback?: ReviewerFeedbackPreview[] | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatMaxValue = (value: number): string =>
  Number.isInteger(value) ? value.toString() : value.toFixed(1);

const formatScore = (value: number, maxValue: number): string =>
  `${value.toFixed(1)} / ${formatMaxValue(maxValue)}`;

const formatReviewCount = (count: number): string =>
  `${count} review${count === 1 ? "" : "s"}`;

const formatScoreValue = (value: number): string =>
  Number.isInteger(value) ? value.toString() : value.toFixed(1);

const getInitials = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return "??";
  return trimmed
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SummaryTab({
  resumeUrl,
  rubricSummary,
  reviewerFeedback,
}: SummaryTabProps) {
  const uploadState = normalizeSummaryUpload(resumeUrl);
  const hasRubricScores = Boolean(rubricSummary?.hasValidScores);
  const rubricCriteria = rubricSummary?.criteria ?? [];
  const contributingReviews = rubricSummary?.contributingReviewCount ?? 0;
  const reviewerLabel = formatReviewCount(contributingReviews);
  const feedbackEntries = reviewerFeedback?.filter(Boolean) ?? [];
  const hasFeedback = feedbackEntries.length > 0;

  return (
    <Stack gap="lg" pb="xl">
      {/* Overall Average */}
      <SummarySection testId="summary-overall" title="Overall Average Rating">
        {hasRubricScores && rubricSummary ? (
          <Box
            p="md"
            style={{
              background: "var(--mantine-color-gray-0)",
              borderRadius: "var(--mantine-radius-lg)",
              border: "1px solid var(--mantine-color-gray-2)",
            }}
          >
            <Group
              justify="space-between"
              align="flex-end"
              wrap="wrap"
              gap="md"
            >
              <Box>
                <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb={4}>
                  Overall Average Rating
                </Text>
                <Group gap="xs" align="baseline">
                  <Text size="3rem" fw={600} lh={1}>
                    {rubricSummary.overallAverage.toFixed(1)}
                  </Text>
                  <Text size="lg" c="dimmed">
                    / {formatMaxValue(rubricSummary.overallMax)}
                  </Text>
                </Group>
              </Box>
              <Text size="sm" c="dimmed">
                based on {reviewerLabel}
              </Text>
            </Group>
          </Box>
        ) : (
          <SummaryEmptyState
            title="No ratings yet"
            message="Once reviewers submit rubric scores, the combined rating will surface here."
          />
        )}
      </SummarySection>

      {/* Rubric Metrics */}
      <SummarySection testId="summary-rubric-metrics" title="Rubric Metrics">
        {hasRubricScores && rubricSummary ? (
          <Stack gap="sm">
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
              {rubricCriteria.map((criterion) => (
                <Box
                  key={criterion.name}
                  p="sm"
                  style={{
                    border: "1px solid var(--mantine-color-gray-2)",
                    borderRadius: "var(--mantine-radius-md)",
                  }}
                >
                  <Group justify="space-between" gap="sm">
                    <Text size="sm" fw={600}>
                      {criterion.name}
                    </Text>
                    <Text size="sm" fw={600}>
                      {criterion.average !== null
                        ? formatScore(criterion.average, criterion.maxVal)
                        : `— / ${formatMaxValue(criterion.maxVal)}`}
                    </Text>
                  </Group>
                </Box>
              ))}
            </SimpleGrid>
            <Text size="xs" c="dimmed">
              based on {reviewerLabel}
            </Text>
          </Stack>
        ) : (
          <SummaryEmptyState
            title="No ratings yet"
            message="Rubric averages will appear once reviewers submit scores."
          />
        )}
      </SummarySection>

      {/* Reviewer Feedback */}
      <SummarySection testId="summary-feedback" title="Reviewer Feedback">
        {hasFeedback ? (
          <Stack gap="md">
            {feedbackEntries.map((feedback) => (
              <Box
                key={feedback.id}
                data-testid="summary-feedback-card"
                p="md"
                style={{
                  border: "1px solid var(--mantine-color-gray-2)",
                  borderRadius: "var(--mantine-radius-md)",
                }}
              >
                <Group gap="sm" align="flex-start" wrap="wrap">
                  <Avatar size={36} color="owlPurple" radius="md">
                    {getInitials(feedback.author)}
                  </Avatar>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="xs" align="center" mb={2}>
                      <Text size="sm" fw={600}>
                        {feedback.author}
                      </Text>
                      {feedback.role && (
                        <Text
                          size="xs"
                          tt="uppercase"
                          c="dimmed"
                          style={{ letterSpacing: "0.05em" }}
                        >
                          {feedback.role}
                        </Text>
                      )}
                      {(() => {
                        const scoreLabel =
                          feedback.scoreLabel ??
                          (feedback.score !== null &&
                          feedback.score !== undefined
                            ? feedback.maxScore !== null &&
                              feedback.maxScore !== undefined
                              ? `${formatScoreValue(feedback.score)} / ${formatMaxValue(feedback.maxScore)}`
                              : formatScoreValue(feedback.score)
                            : null);
                        return scoreLabel ? (
                          <Box
                            px="xs"
                            py={2}
                            style={{
                              border: "1px solid var(--mantine-color-gray-3)",
                              borderRadius: 999,
                              background: "var(--mantine-color-gray-1)",
                              fontSize: 10,
                              fontWeight: 600,
                              color: "var(--mantine-color-gray-7)",
                            }}
                          >
                            {scoreLabel}
                          </Box>
                        ) : null;
                      })()}
                    </Group>
                    <Text size="xs" c="dimmed">
                      {feedback.submittedAt
                        ? formatRelativeTime(feedback.submittedAt)
                        : "—"}
                    </Text>
                  </Box>
                </Group>
                {(feedback.rubricScores?.length ?? 0) > 0 && (
                  <Group gap="xs" mt="sm" wrap="wrap">
                    {feedback.rubricScores?.map((rubricScore) => (
                      <Box
                        key={`${feedback.id}-${rubricScore.name}`}
                        px="sm"
                        py={4}
                        style={{
                          border: "1px solid var(--mantine-color-gray-2)",
                          borderRadius: "var(--mantine-radius-md)",
                          background: "var(--mantine-color-gray-0)",
                          display: "inline-flex",
                          gap: 4,
                          fontSize: 12,
                        }}
                      >
                        <Text span size="xs" c="dimmed">
                          {rubricScore.name}:
                        </Text>
                        <Text span size="xs" fw={600}>
                          {formatScoreValue(rubricScore.score)}
                        </Text>
                      </Box>
                    ))}
                  </Group>
                )}
                {!feedback.rubricScores?.length && feedback.summary && (
                  <Text size="sm" c="dimmed" mt="sm">
                    {feedback.summary}
                  </Text>
                )}
              </Box>
            ))}
          </Stack>
        ) : (
          <SummaryEmptyState
            title="No reviewer feedback yet"
            message="Reviewer rubric submissions will appear here once scores are submitted."
          />
        )}
      </SummarySection>

      {/* Uploads */}
      <SummarySection testId="summary-uploads" title="Uploads">
        {uploadState.mode === "preview" && (
          <Stack gap="sm" data-testid="summary-upload-preview">
            <Text size="sm" c="dimmed">
              View the resume inline or open the original file in a new tab.
            </Text>
            <Box
              style={{
                overflow: "hidden",
                borderRadius: "var(--mantine-radius-md)",
                border: "1px solid var(--mantine-color-gray-2)",
              }}
            >
              <iframe
                src={uploadState.previewUrl}
                style={{ height: 420, width: "100%", border: 0 }}
                title="Applicant resume preview"
                allow="autoplay"
              />
            </Box>
            <a
              href={uploadState.url}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--mantine-color-owlPurple-6)",
              }}
            >
              Open original file
            </a>
          </Stack>
        )}
        {uploadState.mode === "link" && (
          <Stack gap="xs" data-testid="summary-upload-link">
            <Text size="sm" c="dimmed">
              The uploaded document can be opened in a new tab.
            </Text>
            <a
              href={uploadState.url}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--mantine-color-owlPurple-6)",
              }}
            >
              Open resume
            </a>
          </Stack>
        )}
        {uploadState.mode === "empty" && (
          <div data-testid="summary-upload-empty">
            <SummaryEmptyState
              title="No uploads provided"
              message="When the applicant supplies files, they will appear here with inline previews."
            />
          </div>
        )}
      </SummarySection>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SummarySectionProps {
  title: string;
  description?: string;
  testId: string;
  children: ReactNode;
}

function SummarySection({
  title,
  description,
  testId,
  children,
}: SummarySectionProps) {
  return (
    <Card withBorder radius="md" shadow="xs" data-testid={testId}>
      <Stack gap="sm">
        <Box>
          <Text fw={600}>{title}</Text>
          {description && (
            <Text size="sm" c="dimmed">
              {description}
            </Text>
          )}
        </Box>
        {children}
      </Stack>
    </Card>
  );
}

interface SummaryEmptyStateProps {
  title: string;
  message: string;
}

function SummaryEmptyState({ title, message }: SummaryEmptyStateProps) {
  return (
    <Box
      p="lg"
      ta="center"
      style={{
        border: "1px dashed var(--mantine-color-gray-3)",
        borderRadius: "var(--mantine-radius-md)",
        background: "var(--mantine-color-gray-0)",
      }}
    >
      <Text size="sm" fw={600}>
        {title}
      </Text>
      <Text size="sm" c="dimmed">
        {message}
      </Text>
    </Box>
  );
}
