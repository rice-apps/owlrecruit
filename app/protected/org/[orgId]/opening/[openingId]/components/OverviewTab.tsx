"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { AssignReviewersDialog } from "@/components/assign-reviewers-dialog";
import type { ApplicationStatus } from "@/types/app";

interface Applicant {
  id: string;
  name: string;
  status: ApplicationStatus;
}

interface AssignedReviewer {
  id: string;
  name: string | null;
  email: string;
}

interface OverviewTabProps {
  applicants: Applicant[];
  orgId: string;
  openingId: string;
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
}: OverviewTabProps) {
  const [reviewers, setReviewers] = useState<AssignedReviewer[]>([]);
  const [reviewerIds, setReviewerIds] = useState<string[]>([]);
  const [loadingReviewers, setLoadingReviewers] = useState(true);

  const fetchReviewers = useCallback(async () => {
    setLoadingReviewers(true);
    try {
      const supabase = createClient();

      // Fetch reviewer_ids from the opening
      const { data: opening, error: openingError } = await supabase
        .from("openings")
        .select("reviewer_ids")
        .eq("id", openingId)
        .single();

      if (openingError) {
        console.error("Failed to fetch opening:", openingError);
        return;
      }

      const ids: string[] = opening?.reviewer_ids ?? [];
      setReviewerIds(ids);

      if (ids.length === 0) {
        setReviewers([]);
        return;
      }

      // Fetch user details for each assigned reviewer
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", ids);

      if (usersError) {
        console.error("Failed to fetch reviewer users:", usersError);
        return;
      }

      setReviewers(users ?? []);
    } finally {
      setLoadingReviewers(false);
    }
  }, [openingId]);

  useEffect(() => {
    fetchReviewers();
  }, [fetchReviewers]);

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
          <AssignReviewersDialog
            orgId={orgId}
            openingId={openingId}
            currentReviewerIds={reviewerIds}
            onSaved={fetchReviewers}
            trigger={
              <button className="text-owl-purple text-sm hover:underline">
                Edit
              </button>
            }
          />
        </div>

        {loadingReviewers ? (
          <div className="text-sm text-muted-foreground">
            Loading reviewers...
          </div>
        ) : reviewers.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {reviewers.map((reviewer) => {
              const displayName = reviewer.name || reviewer.email;
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
