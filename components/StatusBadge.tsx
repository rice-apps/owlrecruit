import { Badge } from "@mantine/core";
import {
  getApplicationStatusColor,
  getOpeningStatusColor,
  getOpeningStatusLabel,
} from "@/lib/status";

interface ApplicationStatusBadgeProps {
  status: string;
  size?: "xs" | "sm" | "md";
}

export function ApplicationStatusBadge({
  status,
  size = "sm",
}: ApplicationStatusBadgeProps) {
  return (
    <Badge
      color={getApplicationStatusColor(status)}
      variant="light"
      size={size}
      radius="sm"
    >
      {status}
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
  return (
    <Badge
      color={getOpeningStatusColor(status)}
      variant="light"
      size={size}
      radius="sm"
    >
      {getOpeningStatusLabel(status)}
    </Badge>
  );
}
