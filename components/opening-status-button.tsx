"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";

import { type OpeningStatus, OpeningStatus as OS } from "@/types/app";

interface OpeningStatusButtonProps {
  orgId: string;
  openingId: string;
  status: OpeningStatus;
}

const nextStatus: Record<OpeningStatus, OpeningStatus> = {
  [OS.DRAFT]: OS.OPEN,
  [OS.OPEN]: OS.CLOSED,
  [OS.CLOSED]: OS.OPEN,
};

const buttonLabel: Record<OpeningStatus, string> = {
  [OS.DRAFT]: "Publish",
  [OS.OPEN]: "Close",
  [OS.CLOSED]: "Reopen",
};

const buttonColor: Record<OpeningStatus, string> = {
  [OS.DRAFT]: "owlTeal",
  [OS.OPEN]: "red",
  [OS.CLOSED]: "green",
};

export function OpeningStatusButton({
  orgId,
  openingId,
  status,
}: OpeningStatusButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<OpeningStatus>(status);

  const handleClick = async () => {
    setLoading(true);
    const target = nextStatus[currentStatus];
    try {
      const res = await fetch(`/api/org/${orgId}/openings/${openingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      if (res.ok) {
        setCurrentStatus(target);
        router.refresh();
      } else {
        notifications.show({
          color: "red",
          message: "Failed to update status.",
        });
      }
    } catch {
      notifications.show({ color: "red", message: "Failed to update status." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      color={buttonColor[currentStatus]}
      variant="light"
      loading={loading}
      onClick={handleClick}
    >
      {buttonLabel[currentStatus]}
    </Button>
  );
}
