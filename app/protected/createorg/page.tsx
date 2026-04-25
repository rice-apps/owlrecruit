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
  Text,
  Card,
  Center,
  Anchor,
} from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { UploadCloud01, AlertCircle } from "@untitled-ui/icons-react";
import { notifications } from "@mantine/notifications";
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
    <Center py="xl">
      <Card radius="lg" shadow="sm" p="xl" maw={700} w="100%">
        <Title order={2} mb="xs">
          Create new organization
        </Title>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Organization Name*"
              required
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              placeholder="e.g. RiceApps"
            />

            <Textarea
              label="Description*"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              placeholder="What does your organization do?"
              minRows={3}
              autosize
            />

            {/* Logo upload — no-op for MVP */}
            <div>
              <Text size="sm" fw={500} mb="xs">
                Logo
              </Text>
              <Dropzone
                onDrop={() => {}}
                accept={IMAGE_MIME_TYPE}
                radius="md"
                styles={{
                  root: { minHeight: 140 },
                }}
              >
                <Stack align="center" justify="center" gap="xs" py="lg">
                  <UploadCloud01
                    width={32}
                    height={32}
                    color="var(--mantine-color-gray-4)"
                  />
                  <Text size="sm" c="dimmed" ta="center">
                    Drag and drop or upload from computer
                  </Text>
                </Stack>
              </Dropzone>
            </div>

            {error && (
              <Alert color="red" icon={<AlertCircle width={16} height={16} />}>
                {error}
              </Alert>
            )}

            <Group justify="space-between" mt="sm">
              <Anchor onClick={() => router.back()} c="dimmed" size="sm">
                Cancel
              </Anchor>
              <Button
                type="submit"
                loading={submitting}
                color="dark"
                radius="xl"
              >
                Create organization
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Center>
  );
}
