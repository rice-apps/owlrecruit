import { cn } from "@/lib/utils";
import type { ApplicationStatus, Score } from "@/types/app";

// Status badge color mapping
const statusColors: Record<ApplicationStatus, string> = {
  "No Status": "bg-gray-100 text-gray-700 border-gray-300",
  Applied: "bg-blue-100 text-blue-700 border-blue-300",
  Interviewing: "bg-cyan-100 text-cyan-700 border-cyan-300",
  Offer: "bg-green-100 text-green-700 border-green-300",
  "Accepted Offer": "bg-emerald-100 text-emerald-700 border-emerald-300",
  Rejected: "bg-red-100 text-red-700 border-red-300",
};

interface StatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        statusColors[status],
        className,
      )}
    >
      {status}
    </span>
  );
}

// Score badge color mapping (positive to negative gradient)
const scoreColors: Record<Score, string> = {
  "Inclined (Strong)": "bg-green-500 text-white",
  Inclined: "bg-green-400 text-white",
  "Inclined (Lean)": "bg-green-200 text-green-800",
  "Disinclined (Lean)": "bg-red-200 text-red-800",
  Disinclined: "bg-red-400 text-white",
  "Disinclined (Strong)": "bg-red-500 text-white",
};

interface ScoreBadgeProps {
  score: Score;
  className?: string;
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        scoreColors[score],
        className,
      )}
    >
      {score}
    </span>
  );
}

// Opening status badge
const openingStatusColors = {
  draft: "bg-gray-100 text-gray-600 border-gray-300",
  open: "bg-cyan-100 text-cyan-700 border-cyan-300",
  closed: "bg-gray-200 text-gray-600 border-gray-400",
};

interface OpeningStatusBadgeProps {
  status: "draft" | "open" | "closed";
  className?: string;
}

export function OpeningStatusBadge({
  status,
  className,
}: OpeningStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase",
        openingStatusColors[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
