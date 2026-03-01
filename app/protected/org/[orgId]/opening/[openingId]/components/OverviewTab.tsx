"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import type { ApplicationStatus } from "@/types/app";

interface Applicant {
  id: string;
  name: string;
  status: ApplicationStatus;
}

interface Reviewer {
  id: string;
  user_id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
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
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loadingReviewers, setLoadingReviewers] = useState(true);

  useEffect(() => {
    async function fetchReviewers() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("org_members")
          .select(
            `
            id,
            user_id,
            role,
            users!user_id (
              id,
              name,
              email
            )
          `,
          )
          .eq("org_id", orgId)
          .eq("role", "reviewer");

        if (error) {
          console.error("Failed to fetch reviewers:", error);
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
        console.error("Failed to fetch reviewers:", error);
      } finally {
        setLoadingReviewers(false);
      }
    }
    fetchReviewers();
  }, [orgId]);

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
                    <div className="w-8 h-full rounded-md bg-cyan-400" />
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
        className="text-cyan-600 text-sm hover:underline inline-block"
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
            onClick={() => alert("Edit functionality coming later!")}
            className="text-cyan-600 text-sm hover:underline"
          >
            Edit
          </button>
        </div>

        {loadingReviewers ? (
          <div className="text-sm text-muted-foreground">
            Loading reviewers...
          </div>
        ) : reviewers.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {reviewers
              .filter((reviewer) => reviewer.user)
              .map((reviewer) => {
                const displayName =
                  reviewer.user?.name || reviewer.user?.email || "Reviewer";
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
