import type { Enums } from "@/types/supabase";

type ApplicationStatus = Enums<"status">;

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
