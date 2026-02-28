"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/types/app";
import { EditReviewersDialog } from "./EditReviewersDialog";

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

// Avatar colours, same as in EditReviewersDialog
const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-indigo-100 text-indigo-700",
];

function colorForId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export function OverviewTab({
  applicants,
  orgId,
  openingId,
}: OverviewTabProps) {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loadingReviewers, setLoadingReviewers] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchReviewers = useCallback(async () => {
    setLoadingReviewers(true);
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
        const transformedData = data.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          role: item.role,
          user:
            Array.isArray(item.users) && item.users.length > 0
              ? item.users[0]
              : item.users,
        }));
        setReviewers(transformedData);
      }
    } catch (error) {
      console.error("Failed to fetch reviewers:", error);
    } finally {
      setLoadingReviewers(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchReviewers();
  }, [fetchReviewers]);

  const reviewerUserIds = useMemo(
    () => reviewers.map((r) => r.user_id),
    [reviewers],
  );

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
            onClick={() => setEditDialogOpen(true)}
            className="text-cyan-600 text-sm hover:underline"
          >
            Edit
          </button>
        </div>

        {loadingReviewers ? (
          <div className="text-sm text-muted-foreground">
            Loading reviewers…
          </div>
        ) : reviewers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {reviewers
              .filter((reviewer) => reviewer.user)
              .map((reviewer) => {
                const displayName =
                  reviewer.user?.name || reviewer.user?.email || "Reviewer";
                return (
                  <div
                    key={reviewer.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 border-dashed border-indigo-400 bg-indigo-50/50 p-3",
                      "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                    )}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback
                        className={cn(
                          "text-sm font-semibold",
                          colorForId(reviewer.user_id),
                        )}
                      >
                        {initials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {displayName}
                    </span>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No reviewers assigned yet
          </p>
        )}
      </div>

      {/* Edit Reviewers Dialog */}
      <EditReviewersDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        orgId={orgId}
        openingId={openingId}
        currentReviewerUserIds={reviewerUserIds}
        onSaved={fetchReviewers}
      />
    </div>
  );
}
