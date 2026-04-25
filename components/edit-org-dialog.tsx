"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { AlertCircle, Pencil01 } from "@untitled-ui/icons-react";

type EditOrgDialogProps = {
  orgId: string;
  orgName: string;
  orgDescription: string | null;
};

export function EditOrgDialog({
  orgId,
  orgName,
  orgDescription,
}: EditOrgDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(orgName);
  const [description, setDescription] = React.useState(orgDescription ?? "");
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName(orgName);
      setDescription(orgDescription ?? "");
      setLogoFile(null);
      setError(null);
    }
  }, [open, orgName, orgDescription]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Organization name is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim() || "");
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const res = await fetch(`/api/org/${orgId}`, {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save changes");
      }

      notifications.show({ color: "green", message: "Organization updated." });
      router.refresh();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <ActionIcon
        variant="subtle"
        color="gray"
        aria-label="Edit organization"
        onClick={() => setOpen(true)}
      >
        <Pencil01 width={18} height={18} />
      </ActionIcon>

      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title="Edit organization"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Organization name"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            minRows={3}
            autosize
          />
          {error && (
            <Alert color="red" icon={<AlertCircle width={16} height={16} />}>
              {error}
            </Alert>
          )}
          <Group justify="flex-end" mt="xs">
            <Button
              variant="default"
              onClick={() => setOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} loading={isSaving}>
              Save changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
