"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sectionShellTokens } from "@/components/org/section-shell";

type OpeningStatus = "draft" | "open" | "closed";
type FilterStatus = "open" | "closed";

interface OpeningItem {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  closes_at: string | null;
}

interface OpeningsGridProps {
  openings: OpeningItem[];
  orgId: string;
  orgName: string;
  isAdmin: boolean;
}

const FILTER_OPTIONS: { label: string; value: FilterStatus }[] = [
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
];

function normalizeOpeningStatus(status: string | null): OpeningStatus {
  return status === "open" || status === "closed" ? status : "draft";
}

function getStatusLabel(status: string | null): string {
  const normalized = normalizeOpeningStatus(status);
  if (normalized === "open") return "Open";
  if (normalized === "closed") return "Closed";
  return "Draft";
}

export function OpeningsGrid({
  openings,
  orgId,
  orgName,
  isAdmin,
}: OpeningsGridProps) {
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus | null>(
    null,
  );

  const filteredOpenings = useMemo(() => {
    if (!selectedStatus) {
      return openings;
    }

    return openings.filter(
      (opening) => normalizeOpeningStatus(opening.status) === selectedStatus,
    );
  }, [openings, selectedStatus]);

  if (!openings.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200/80 bg-white/70 px-6 py-12 text-center">
        <h3 className="text-lg font-medium text-gray-600">No Openings Yet</h3>
        <p className={`text-sm ${sectionShellTokens.mutedCopy}`}>
          {isAdmin
            ? "Create your first opening to start recruiting."
            : "There are no openings for this organization yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map((option) => {
          const isActive = selectedStatus === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setSelectedStatus((current) =>
                  current === option.value ? null : option.value,
                )
              }
              className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "border-cyan-600 bg-cyan-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              }`}
              aria-pressed={isActive}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {filteredOpenings.length > 0 ? (
        <div
          className={`grid ${sectionShellTokens.cardSpacing} md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}
        >
          {filteredOpenings.map((opening) => (
            <Link
              key={opening.id}
              href={`/protected/org/${orgId}/opening/${opening.id}`}
            >
              <Card className="group relative flex h-full min-h-[250px] flex-col overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md">
                <div className="h-16 w-full bg-rose-300" />

                <div className="absolute top-11 left-4 flex h-12 w-12 items-center justify-center rounded-lg border border-slate-100 bg-white shadow-sm">
                  <span className="text-lg font-semibold text-rose-500">
                    {(opening.title || "O").charAt(0).toUpperCase()}
                  </span>
                </div>

                <CardContent className="flex flex-grow flex-col p-4 pt-8">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg font-bold leading-tight text-slate-900">
                      {opening.title || "Untitled Opening"}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="text-[11px] font-medium"
                    >
                      {getStatusLabel(opening.status)}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-500">{orgName}</p>

                  {opening.description && (
                    <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                      {opening.description}
                    </p>
                  )}

                  <div className="mt-auto border-t pt-3 text-xs text-gray-400">
                    {opening.closes_at
                      ? `Due ${new Date(opening.closes_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "2-digit",
                            day: "2-digit",
                            year: "numeric",
                          },
                        )}`
                      : "No deadline"}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200/80 bg-white/70 px-6 py-10 text-center">
          <p className="text-sm text-slate-500">
            No positions match this status filter.
          </p>
        </div>
      )}
    </div>
  );
}
