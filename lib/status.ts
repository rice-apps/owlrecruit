import type { MantineColor } from "@mantine/core";

// Application statuses (matches DB enum)
const APPLICATION_STATUS_LABELS: Record<string, string> = {
  "No Status": "No Status",
  Applied: "Applied",
  Interviewing: "Interviewing",
  Offer: "Offer",
  "Accepted Offer": "Accepted Offer",
  Rejected: "Rejected",
};

export const APPLICATION_STATUS_LIST = Object.keys(APPLICATION_STATUS_LABELS);

export const TERMINAL_STATUSES = new Set(["Accepted Offer", "Rejected"]);

export function getApplicationStatusColor(status: string): MantineColor {
  switch (status) {
    case "Applied":
      return "blue";
    case "Interviewing":
      return "orange";
    case "Offer":
      return "violet";
    case "Accepted Offer":
      return "green";
    case "Rejected":
      return "red";
    default:
      return "gray";
  }
}

// Opening statuses
export function getOpeningStatusColor(status: string): MantineColor {
  switch (status) {
    case "open":
      return "green";
    case "closed":
      return "red";
    case "draft":
      return "gray";
    default:
      return "gray";
  }
}

export function getOpeningStatusLabel(status: string): string {
  switch (status) {
    case "open":
      return "Open";
    case "closed":
      return "Closed";
    case "draft":
      return "Draft";
    default:
      return status;
  }
}
