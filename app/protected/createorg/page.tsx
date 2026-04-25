"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Stack,
  TextInput,
  Textarea,
  Button,
  Group,
  Alert,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { AlertCircle } from "@untitled-ui/icons-react";
import { logger } from "@/lib/logger";

export default function NewOrgPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogoChange = (file: File | null) => {
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0] ?? null;
    handleLogoChange(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Organization name is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error ?? "Failed to create organization");

      // Full reload so sidebar refreshes with new org
      window.location.href = `/protected/org/${json.data?.id ?? json.id}`;
    } catch (err) {
      logger.error("Error creating organization:", err);
      const msg =
        err instanceof Error ? err.message : "Failed to create organization";
      setError(msg);
      notifications.show({ color: "red", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack maw={560} gap="lg">
      <Title order={2}>Create new organization</Title>

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Organization name"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="e.g. RiceApps"
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            placeholder="What does your organization do?"
            minRows={3}
            autosize
          />

          {error && (
            <Alert color="red" icon={<AlertCircle width={16} height={16} />}>
              {error}
            </Alert>
          )}

          <Group justify="flex-end" mt="sm">
            <Button
              variant="default"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create organization
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  );
}
