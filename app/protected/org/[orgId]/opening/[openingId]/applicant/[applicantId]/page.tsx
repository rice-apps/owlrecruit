"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "@untitled-ui/icons-react";
import { Json } from "@/types/supabase";
import { createClient } from "@/lib/supabase/client";
import { ApplicantTabs } from "./components/ApplicantTabs";
import { CommentsSidebar } from "@/app/protected/org/[orgId]/opening/[openingId]/applicant/[applicantId]/components/comments-sidebar";
import {
  SummaryTab,
  type ReviewerFeedbackPreview,
} from "@/app/protected/org/[orgId]/opening/[openingId]/applicant/[applicantId]/components/SummaryTab";
import {
  computeRubricSummary,
  type RubricCriterion,
  type RubricSummaryMetrics,
} from "@/app/protected/org/[orgId]/opening/[openingId]/applicant/[applicantId]/components/summary-metrics";

interface ApplicationData {
  form_responses: Json;
  resume_url: string | null;
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

const UNKNOWN_REVIEWER = "Unknown Reviewer";

const parseScoreValue = (value: unknown, maxScore: number): number | null => {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  if (numeric < 0 || numeric > maxScore) {
    return null;
  }

  return numeric;
};

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

interface ResumeViewerProps {
  resumeUrl: string | null;
}

function ResumeViewer({ resumeUrl }: ResumeViewerProps) {
  if (!resumeUrl) {
    return <div className="text-gray-500">No resume available</div>;
  }

  // Convert Google Drive URL to preview URL
  const getPreviewUrl = (url: string): string => {
    // Extract file ID from various Google Drive URL formats
    // Format 1: https://drive.google.com/open?id=FILE_ID
    // Format 2: https://drive.google.com/file/d/FILE_ID/view
    // Format 3: https://drive.google.com/uc?id=FILE_ID
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
  const previewUrl = getPreviewUrl(resumeUrl);
  return (
    <div className="w-full h-[800px]">
      <iframe
        src={previewUrl}
        className="w-full h-full border rounded-lg"
        title="Applicant Resume"
        allow="autoplay"
      />
    </div>
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
  const showReviewSidebar = tab !== "summary";
  const [applicationData, setApplicationData] =
    useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryTabState | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryFetchAttempted, setSummaryFetchAttempted] = useState(false);

  useEffect(() => {
    async function fetchApplicationData() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("applications")
          .select("form_responses, resume_url")
          .eq("id", applicantId)
          .single();

        if (error) throw error;
        setApplicationData(data);
      } catch (err) {
        console.error("Error fetching application data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchApplicationData();
  }, [applicantId]);

  useEffect(() => {
    setSummaryData(null);
    setSummaryError(null);
    setSummaryFetchAttempted(false);
    setSummaryLoading(false);
  }, [applicantId, orgId]);

  useEffect(() => {
    if (tab !== "summary" || summaryFetchAttempted) {
      return;
    }

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

        if (!isMounted) {
          return;
        }

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

            if (parsedValue === null) {
              return [];
            }

            return [
              {
                name: criterion.name,
                score: parsedValue,
                maxScore: criterion.max_val,
              },
            ];
          });

          if (rubricScores.length === 0) {
            return [];
          }

          const totalScore = rubricScores.reduce(
            (sum, rubricScore) => sum + rubricScore.score,
            0,
          );
          const totalMaxScore = rubricScores.reduce(
            (sum, rubricScore) => sum + rubricScore.maxScore,
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
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Error fetching summary data:", error);

        if (isMounted) {
          setSummaryError("Unable to load summary data. Please try again.");
        }
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
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
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
          <div className="space-y-4">
            {applicationData?.form_responses &&
              typeof applicationData.form_responses === "object" &&
              !Array.isArray(applicationData.form_responses) && (
                <div>
                  {Object.entries(applicationData.form_responses).map(
                    ([key, value]) => (
                      <div key={key} className="w-fit border-b border-gray-300">
                        <p>
                          <br />
                          <strong>{key} </strong>
                          <br />
                          <span style={{ textDecorationColor: "gray" }}>
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value)}
                          </span>
                        </p>
                      </div>
                    ),
                  )}
                </div>
              )}
          </div>
        );
      case "files":
        return (
          <div className="space-y-4">
            {applicationData?.resume_url && (
              <div>
                <ResumeViewer resumeUrl={applicationData.resume_url} />
              </div>
            )}
          </div>
        );
      case "summary": {
        const summaryResumeUrl =
          summaryData?.resumeUrl ?? applicationData?.resume_url ?? null;

        if (summaryLoading || !summaryFetchAttempted) {
          return (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              Loading summary data...
            </div>
          );
        }

        if (summaryError) {
          return (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-center">
              <p className="text-sm text-destructive">{summaryError}</p>
              <Button size="sm" className="mt-3" onClick={handleSummaryRetry}>
                Retry
              </Button>
            </div>
          );
        }

        if (!summaryData) {
          return (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              Summary data is not available yet.
            </div>
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
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 w-full flex gap-6 h-[calc(100vh-theme(spacing.16))]">
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/protected/org/${orgId}/opening/${openingId}`)
          }
          className="w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Opening
        </Button>

        <h1 className="text-3xl font-bold">{applicantName}</h1>
        <h2 className="text-xl text-muted-foreground">
          {applicantEmail} <span className="mx-2">•</span> {applicantMajor}
        </h2>
        {loading ? (
          <p>Loading application data...</p>
        ) : (
          <>
            <ApplicantTabs />
            <div className="flex gap-4">
              <div className={showReviewSidebar ? "w-2/3 pr-4" : "w-full"}>
                {renderTabContent()}
              </div>
            </div>
          </>
        )}
      </div>
      {showReviewSidebar ? (
        <CommentsSidebar
          applicantId={applicantId}
          openingId={openingId}
          orgId={orgId}
        />
      ) : null}
    </div>
  );
}
