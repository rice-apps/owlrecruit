"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Group,
  Alert,
  Stack,
  SegmentedControl,
  ActionIcon,
  Text,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { AlertCircle, Pencil01 } from "@untitled-ui/icons-react";

interface EditOpeningDialogProps {
  orgId: string;
  openingId: string;
  initialData: {
    title: string;
    description?: string;
    application_link?: string;
    closes_at?: string;
    status: "draft" | "open" | "closed";
  };
}

export function EditOpeningDialog({
  orgId,
  openingId,
  initialData,
}: EditOpeningDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description || "");
  const [applicationMethod, setApplicationMethod] = useState<
    "native" | "external"
  >(initialData.application_link ? "external" : "native");
  const [applicationLink, setApplicationLink] = useState(
    initialData.application_link || "",
  );
  const [closesAt, setClosesAt] = useState<string | null>(
    initialData.closes_at ?? null,
  );
  const [status, setStatus] = useState(initialData.status);

  useEffect(() => {
    if (open) {
      setSaveError(null);
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setApplicationMethod(
        initialData.application_link ? "external" : "native",
      );
      setApplicationLink(initialData.application_link || "");
      setClosesAt(initialData.closes_at ?? null);
      setStatus(initialData.status);
    }
  }, [open, initialData]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/org/${orgId}/openings/${openingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          application_link:
            applicationMethod === "native" ? null : applicationLink || null,
          closes_at: closesAt ?? null,
          status,
        }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setSaveError(
          data?.error || "Failed to save changes. Please try again.",
        );
      }
    } catch {
      setSaveError("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ActionIcon
        variant="subtle"
        color="gray"
        size="sm"
        aria-label="Edit opening"
        onClick={() => setOpen(true)}
      >
        <Pencil01 width={16} height={16} />
      </ActionIcon>

      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title="Edit Opening"
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            minRows={3}
            autosize
          />

          <div>
            <Text size="sm" fw={500} mb="xs">
              Application Method
            </Text>
            <SegmentedControl
              value={applicationMethod}
              onChange={(val) => {
                setApplicationMethod(val as "native" | "external");
                if (val === "native") setApplicationLink("");
                else if (!applicationLink) setApplicationLink("https://");
              }}
              data={[
                { label: "Native Form", value: "native" },
                { label: "External Link", value: "external" },
              ]}
            />
            {applicationMethod === "external" && (
              <TextInput
                type="url"
                value={applicationLink}
                onChange={(e) => setApplicationLink(e.currentTarget.value)}
                placeholder="https://forms.google.com/..."
                mt="xs"
              />
            )}
          </div>

          <DateTimePicker
            label="Closes At"
            placeholder="Select date and time"
            value={closesAt}
            onChange={setClosesAt}
            clearable
          />

          <div>
            <Text size="sm" fw={500} mb="xs">
              Status
            </Text>
            <SegmentedControl
              value={status}
              onChange={(val) => setStatus(val as "draft" | "open" | "closed")}
              data={[
                { label: "Draft", value: "draft" },
                { label: "Open", value: "open" },
                { label: "Closed", value: "closed" },
              ]}
            />
          </div>

          {saveError && (
            <Alert color="red" icon={<AlertCircle width={16} height={16} />}>
              {saveError}
            </Alert>
          )}

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!title.trim()}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
