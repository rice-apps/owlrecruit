import type { ApplicationStatus } from "@/types/app";

export const getStatusBadgeVariant = (
  status: ApplicationStatus | null,
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "No Status":
    case "Applied":
      return "secondary";
    case "Interviewing":
    case "Offer":
    case "Accepted Offer":
      return "default";
    case "Rejected":
      return "destructive";
    default:
      return "outline";
  }
};
