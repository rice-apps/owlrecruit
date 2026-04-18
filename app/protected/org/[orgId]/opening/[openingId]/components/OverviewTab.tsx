"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { ApplicationStatus } from "@/types/app";
import { logger } from "@/lib/logger";
import { ChevronDown, UsersPlus, X } from "@untitled-ui/icons-react";

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
  const [eligibleReviewers, setEligibleReviewers] = useState<EligibleReviewer[]>(
    [],
  );
  const [selectedReviewerIds, setSelectedReviewerIds] = useState<string[]>([]);
  const [savingReviewers, setSavingReviewers] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const fetchReviewers = async () => {
    try {
      const supabase = createClient();
      const { data: opening, error: openingError } = await supabase
        .from("openings")
        .select("reviewer_ids")
        .eq("id", openingId)
        .eq("org_id", orgId)
        .single();

      if (openingError) {
        console.error("Failed to fetch opening reviewers:", openingError);
        return;
      }

      const reviewerIds = Array.isArray(opening?.reviewer_ids)
        ? opening.reviewer_ids.filter(
            (id: unknown): id is string => typeof id === "string",
          )
          .eq("org_id", orgId)
          .eq("role", "reviewer");

        if (error) {
          logger.error("Failed to fetch reviewers:", error);
        } else if (data) {
          // Transform data: Supabase returns users as an array, convert to single object
          const transformedData = data.map(
            (item: {
              id: string;
              user_id: string;
              role: string;
              users: unknown;
            }) => ({
              id: item.id,
              user_id: item.user_id,
              role: item.role,
              user:
                Array.isArray(item.users) && item.users.length > 0
                  ? item.users[0]
                  : item.users,
            }),
          );
          setReviewers(transformedData);
        }
      } catch (error) {
        logger.error("Failed to fetch reviewers:", error);
      } finally {
        setLoadingReviewers(false);
      }

      const usersById = new Map((users || []).map((user) => [user.id, user]));
      const orderedReviewers = reviewerIds
        .map((id) => usersById.get(id))
        .filter((user): user is Reviewer => Boolean(user));

      setReviewers(orderedReviewers);
    } catch (error) {
      console.error("Failed to fetch reviewers:", error);
    } finally {
      setLoadingReviewers(false);
    }
  };

  useEffect(() => {
    fetchReviewers();
  }, [orgId, openingId]);

  const handleEditReviewers = async () => {
    setIsEditingReviewers(true);
    setIsDropdownOpen(false);

    if (eligibleReviewers.length > 0) {
      return;
    }

    try {
      const res = await fetch(`/api/org/${orgId}/members?role=admin,reviewer`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch eligible reviewers");
      const data = await res.json();
      setEligibleReviewers(data as EligibleReviewer[]);
    } catch (error) {
      console.error(error);
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
      console.error(error);
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

  return (
    <div className="py-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Submissions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalSubmissions}</p>
          </CardContent>
        </Card>

        {/* Accepted */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Accepted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{acceptedCount}</p>
          </CardContent>
        </Card>

        {/* Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusBreakdown.length > 0 ? (
              <div className="flex items-end gap-2 h-16">
                {statusBreakdown.map(({ status, count }) => (
                  <div
                    key={status}
                    className="group relative"
                    style={{
                      height: `${(count / maxCount) * 100}%`,
                      minHeight: "8px",
                    }}
                  >
                    <div className="w-8 h-full rounded-md bg-owl-purple" />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {status}: {count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Application Form Link */}
      {openingStatus === "open" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Application Form Link
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {applicationLink ? (
              <>
                <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">
                  {applicationLink}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(applicationLink)}
                >
                  Copy
                </Button>
              </>
            ) : (
              <>
                <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">
                  {origin}/apply/{openingId}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `${origin}/apply/${openingId}`,
                    )
                  }
                >
                  Copy
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rubric Settings */}
      <Link
        href={`/protected/org/${orgId}/opening/${openingId}/rubric`}
        className="text-owl-purple text-sm hover:underline inline-block"
      >
        Rubric Settings
      </Link>

      {/* Assigned Reviewers */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <h2 className="text-base font-semibold uppercase tracking-wide">
            Assigned Reviewers
          </h2>
          <button
            onClick={handleEditReviewers}
            className="text-owl-purple text-sm hover:underline"
          >
            Edit
          </button>
        </div>

        {isEditingReviewers && (
          <div className="border rounded-lg p-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              {selectedReviewerIds.length > 0 ? (
                selectedReviewerIds.map((userId) => {
                  const reviewer = eligibleReviewers.find(
                    (entry) => entry.user_id === userId,
                  );

                  if (!reviewer) return null;

                  const user = Array.isArray(reviewer.users)
                    ? reviewer.users[0]
                    : reviewer.users;

                  const displayName = user?.name || user?.email;
                  if (!displayName) return null;

                  return (
                    <button
                      key={userId}
                      type="button"
                      onClick={() =>
                        setSelectedReviewerIds((prev) =>
                          prev.filter((id) => id !== userId),
                        )
                      }
                      className="flex items-center gap-2 pl-4 pr-3 py-2 bg-white text-gray-900 rounded-full border-2 border-gray-200 hover:border-gray-300 transition-all shadow-sm hover:shadow"
                    >
                      <span className="font-medium text-sm">{displayName}</span>
                      <X className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 py-2">No reviewers assigned</p>
              )}
            </div>

            {eligibleReviewers.length > 0 && (
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full justify-between gap-2 inline-flex items-center px-4 py-2 border rounded-md hover:bg-gray-50"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                >
                  <span className="flex items-center gap-2">
                    <UsersPlus className="h-4 w-4" />
                    Add Reviewer
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`${isDropdownOpen ? "" : "hidden"} border rounded-lg max-h-48 overflow-y-auto`}
                >
                  {eligibleReviewers.map((reviewer) => {
                    const user = Array.isArray(reviewer.users)
                      ? reviewer.users[0]
                      : reviewer.users;

                    const isSelected = selectedReviewerIds.includes(
                      reviewer.user_id,
                    );

                    return (
                      <button
                        key={reviewer.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedReviewerIds((prev) =>
                              prev.filter((id) => id !== reviewer.user_id),
                            );
                          } else {
                            setSelectedReviewerIds((prev) => [
                              ...prev,
                              reviewer.user_id,
                            ]);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors ${
                          isSelected ? "bg-owl-purple/5" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded"
                          />
                          <div className="text-left">
                            <p className="font-medium text-sm">
                              {user?.name || "Unknown User"}
                            </p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 uppercase">
                          {reviewer.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedReviewerIds(reviewers.map((reviewer) => reviewer.id));
                  setIsEditingReviewers(false);
                  setIsDropdownOpen(false);
                }}
                className="text-sm px-3 py-1.5 rounded border"
                disabled={savingReviewers}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReviewers}
                className="text-sm px-3 py-1.5 rounded bg-owl-purple text-white"
                disabled={savingReviewers}
              >
                {savingReviewers ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}

        {loadingReviewers ? (
          <div className="text-sm text-muted-foreground">
            Loading reviewers...
          </div>
        ) : reviewers.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {reviewers.map((reviewer) => {
              const displayName = reviewer.name || reviewer.email || "Reviewer";
              return (
                <Card key={reviewer.id} className="w-fit">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                        {displayName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{displayName}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No reviewers assigned yet
          </p>
        )}
      </div>
    </div>
  );
}
