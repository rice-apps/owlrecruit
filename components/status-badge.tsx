import { cn } from "@/lib/utils";
import type { ApplicationStatus, Score } from "@/types/app";

// Status badge color mapping
const statusColors: Record<ApplicationStatus, string> = {
  "No Status": "bg-muted text-foreground border-border",
  Applied: "bg-background text-muted-foreground border-border",
  Interviewing: "bg-muted text-foreground border-transparent",
  Offer: "bg-owl-green text-white border-transparent",
  "Accepted Offer": "bg-owl-green text-white border-transparent",
  Rejected: "bg-owl-red text-white border-transparent",
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
  draft: "bg-muted text-muted-foreground border-border",
  open: "bg-owl-purple/10 text-owl-purple border-owl-purple/30",
  closed: "bg-muted text-muted-foreground border-border",
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
