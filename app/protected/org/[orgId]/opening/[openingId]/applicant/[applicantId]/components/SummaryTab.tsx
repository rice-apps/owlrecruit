"use client";

import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/date-utils";
import type { RubricSummaryMetrics } from "./summary-metrics";
import { normalizeSummaryUpload } from "./summary-uploads";

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
  if (!trimmed) {
    return "??";
  }

  return trimmed
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

export function SummaryTab({
  applicantName,
  applicantEmail,
  applicantMajor,
  resumeUrl,
  rubricSummary,
  reviewerFeedback,
}: SummaryTabProps) {
  void applicantName;
  void applicantEmail;
  void applicantMajor;
  const uploadState = normalizeSummaryUpload(resumeUrl);
  const hasRubricScores = Boolean(rubricSummary?.hasValidScores);
  const rubricCriteria = rubricSummary?.criteria ?? [];
  const contributingReviews = rubricSummary?.contributingReviewCount ?? 0;
  const reviewerLabel = formatReviewCount(contributingReviews);
  const feedbackEntries = reviewerFeedback?.filter(Boolean) ?? [];
  const hasFeedback = feedbackEntries.length > 0;

  return (
    <div className="space-y-6 pb-10">
      <SummarySection testId="summary-overall" title="Overall Average Rating">
        <div className="flex flex-col gap-4">
          {hasRubricScores && rubricSummary ? (
            <div className="flex flex-col gap-3 rounded-2xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Overall Average Rating
                </p>
                <p className="text-5xl font-semibold leading-none text-foreground">
                  {rubricSummary.overallAverage.toFixed(1)}
                  <span className="text-lg font-normal text-muted-foreground">
                    {" "}
                    / {formatMaxValue(rubricSummary.overallMax)}
                  </span>
                </p>
              </div>
              <p className="text-sm text-muted-foreground text-left sm:text-right">
                based on {reviewerLabel}
              </p>
            </div>
          ) : (
            <SummaryEmptyState
              title="No ratings yet"
              message="Once reviewers submit rubric scores, the combined rating will surface here."
            />
          )}
        </div>
      </SummarySection>

      <SummarySection testId="summary-rubric-metrics" title="Rubric Metrics">
        {hasRubricScores && rubricSummary ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {rubricCriteria.map((criterion) => (
                <div
                  key={criterion.name}
                  className="rounded-2xl border bg-card p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      {criterion.name}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {criterion.average !== null
                        ? formatScore(criterion.average, criterion.maxVal)
                        : `— / ${formatMaxValue(criterion.maxVal)}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              based on {reviewerLabel}
            </p>
          </div>
        ) : (
          <SummaryEmptyState
            title="No ratings yet"
            message="Rubric averages will appear once reviewers submit scores."
          />
        )}
      </SummarySection>

      <SummarySection testId="summary-feedback" title="Reviewer Feedback">
        {hasFeedback ? (
          <div className="space-y-4">
            {feedbackEntries.map((feedback) => (
              <div
                key={feedback.id}
                data-testid="summary-feedback-card"
                className="rounded-2xl border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {getInitials(feedback.author)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {feedback.author}
                      </span>
                      {feedback.role && (
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {feedback.role}
                        </span>
                      )}
                      {(() => {
                        const scoreLabel =
                          feedback.scoreLabel ??
                          (feedback.score !== null &&
                          feedback.score !== undefined
                            ? feedback.maxScore !== null &&
                              feedback.maxScore !== undefined
                              ? `${formatScoreValue(feedback.score)} / ${formatMaxValue(
                                  feedback.maxScore,
                                )}`
                              : formatScoreValue(feedback.score)
                            : null);

                        return scoreLabel ? (
                          <span className="rounded-full border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            {scoreLabel}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {feedback.submittedAt
                        ? formatRelativeTime(feedback.submittedAt)
                        : "—"}
                    </span>
                  </div>
                </div>
                {(feedback.rubricScores?.length ?? 0) > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {feedback.rubricScores?.map((rubricScore) => (
                      <span
                        key={`${feedback.id}-${rubricScore.name}`}
                        className="inline-flex items-center gap-1 rounded-xl border bg-muted/50 px-3 py-1 text-xs"
                      >
                        <span className="text-muted-foreground">
                          {rubricScore.name}:
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatScoreValue(rubricScore.score)}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
                {!feedback.rubricScores?.length && feedback.summary && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {feedback.summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <SummaryEmptyState
            title="No reviewer feedback yet"
            message="Reviewer rubric submissions will appear here once scores are submitted."
          />
        )}
      </SummarySection>

      <SummarySection testId="summary-uploads" title="Uploads">
        {uploadState.mode === "preview" && (
          <div className="space-y-3" data-testid="summary-upload-preview">
            <p className="text-sm text-muted-foreground">
              View the resume inline or open the original file in a new tab.
            </p>
            <div className="overflow-hidden rounded-2xl border">
              <iframe
                src={uploadState.previewUrl}
                className="h-[420px] w-full border-0"
                title="Applicant resume preview"
                allow="autoplay"
              />
            </div>
            <a
              href={uploadState.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-cyan-600 hover:underline"
            >
              Open original file
            </a>
          </div>
        )}
        {uploadState.mode === "link" && (
          <div className="space-y-2" data-testid="summary-upload-link">
            <p className="text-sm text-muted-foreground">
              The uploaded document can be opened in a new tab.
            </p>
            <a
              href={uploadState.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-cyan-600 hover:underline"
            >
              Open resume
            </a>
          </div>
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
    </div>
  );
}

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
    <Card data-testid={testId} className="shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base font-semibold text-foreground">
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

interface SummaryEmptyStateProps {
  title: string;
  message: string;
}

function SummaryEmptyState({ title, message }: SummaryEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
