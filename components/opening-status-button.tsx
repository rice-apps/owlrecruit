"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@mantine/core";

import type { OpeningStatus } from "@/types/app";

interface OpeningStatusButtonProps {
  orgId: string;
  openingId: string;
  status: OpeningStatus;
}

const nextStatus: Record<OpeningStatus, OpeningStatus> = {
  draft: "open",
  open: "closed",
  closed: "open",
};

const buttonLabel: Record<OpeningStatus, string> = {
  draft: "Publish",
  open: "Close",
  closed: "Reopen",
};

const buttonColor: Record<OpeningStatus, string> = {
  draft: "owlTeal",
  open: "red",
  closed: "green",
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
      }
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
