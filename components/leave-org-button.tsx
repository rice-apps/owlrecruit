"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Menu, Text, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { ConfirmModal } from "@/components/ConfirmModal";
import { logger } from "@/lib/logger";

interface LeaveOrgButtonProps {
  orgId: string;
  userId: string;
  isAdmin: boolean;
  orgName: string;
  asMenuItem?: boolean;
}

export function LeaveOrgButton({
  orgId,
  userId,
  isAdmin,
  orgName,
  asMenuItem = false,
}: LeaveOrgButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLeave = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/org/${orgId}/members/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to leave organization");
      router.push("/protected/discover");
      router.refresh();
    } catch (err) {
      logger.error("Failed to leave organization:", err);
      notifications.show({
        color: "red",
        message: "Failed to leave organization. Please try again.",
      });
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      {asMenuItem ? (
        <Menu.Item color="red" disabled={isAdmin} onClick={() => setOpen(true)}>
          {isAdmin ? "Leave (transfer admin first)" : "Leave organization"}
        </Menu.Item>
      ) : (
        <Group gap="sm">
          <Button
            variant="subtle"
            color="red"
            size="sm"
            disabled={isAdmin}
            onClick={() => setOpen(true)}
            title={
              isAdmin
                ? "Admins cannot leave. Transfer admin rights first."
                : undefined
            }
          >
            Leave organization
          </Button>
          {isAdmin && (
            <Text size="sm" c="dimmed">
              Transfer admin role first to leave
            </Text>
          )}
        </Group>
      )}
      <ConfirmModal
        opened={open}
        onClose={() => setOpen(false)}
        onConfirm={handleLeave}
        title="Leave organization"
        message={`Are you sure you want to leave ${orgName}?`}
        confirmLabel="Leave"
        confirmColor="red"
        loading={loading}
      />
    </>
  );
}
