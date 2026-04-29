import { Badge } from "@mantine/core";
import {
  getApplicationStatusColor,
  getOpeningStatusColor,
  getOpeningStatusLabel,
} from "@/lib/status";
import { ApplicationStatus, OpeningStatus } from "@/types/app";

interface ApplicationStatusBadgeProps {
  status: string;
  size?: "xs" | "sm" | "md";
}

export function ApplicationStatusBadge({
  status,
  size = "sm",
}: ApplicationStatusBadgeProps) {
  const isPending = status === ApplicationStatus.NO_STATUS || !status;
  return (
    <Badge
      color={getApplicationStatusColor(status)}
      variant={isPending ? "outline" : "filled"}
      size={size}
      radius="xl"
    >
      {status || "No Status"}
    </Badge>
  );
}

interface OpeningStatusBadgeProps {
  status: string;
  size?: "xs" | "sm" | "md";
}

export function OpeningStatusBadge({
  status,
  size = "sm",
}: OpeningStatusBadgeProps) {
  const isPending = status === OpeningStatus.DRAFT || !status;
  return (
    <Badge
      color={getOpeningStatusColor(status)}
      variant={isPending ? "outline" : "filled"}
      size={size}
      radius="xl"
    >
      {getOpeningStatusLabel(status)}
    </Badge>
  );
}
