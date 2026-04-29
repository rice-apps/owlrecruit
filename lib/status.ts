import type { MantineColor } from "@mantine/core";
import { ApplicationStatus, OpeningStatus } from "@/types/app";

export const APPLICATION_STATUS_LIST = Object.values(ApplicationStatus);

export const TERMINAL_STATUSES: Set<string> = new Set([
  ApplicationStatus.ACCEPTED_OFFER,
  ApplicationStatus.REJECTED,
]);

export function getApplicationStatusColor(status: string): MantineColor {
  switch (status) {
    case ApplicationStatus.APPLIED:
      return "blue";
    case ApplicationStatus.INTERVIEWING:
      return "orange";
    case ApplicationStatus.OFFER:
      return "violet";
    case ApplicationStatus.ACCEPTED_OFFER:
      return "green";
    case ApplicationStatus.REJECTED:
      return "red";
    default:
      return "gray";
  }
}

// Opening statuses
export function getOpeningStatusColor(status: string): MantineColor {
  switch (status) {
    case OpeningStatus.OPEN:
      return "green";
    case OpeningStatus.CLOSED:
      return "red";
    case OpeningStatus.DRAFT:
      return "gray";
    default:
      return "gray";
  }
}

export function getOpeningStatusLabel(status: string): string {
  switch (status) {
    case OpeningStatus.OPEN:
      return "Open";
    case OpeningStatus.CLOSED:
      return "Closed";
    case OpeningStatus.DRAFT:
      return "Draft";
    default:
      return status;
  }
}
