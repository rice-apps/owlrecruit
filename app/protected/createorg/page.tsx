"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Anchor,
  Button,
  Card,
  Center,
  Group,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { AlertCircle, UploadCloud01 } from "@untitled-ui/icons-react";
import { notifications } from "@mantine/notifications";

export default function NewOrgPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: { name: "", description: "" },
    validate: {
      name: (v) => (v.trim() ? null : "Organization name is required"),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          description: values.description.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error ?? "Failed to create organization");

      // Full reload so sidebar refreshes with new org
      window.location.href = `/protected/org/${json.data?.id ?? json.id}`;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to create organization";
      setError(msg);
      notifications.show({ color: "red", message: msg });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Center py="xl">
      <Card radius="lg" shadow="sm" p="xl" maw={700} w="100%">
        <Title order={2} mb="xs">
          Create new organization
        </Title>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Organization Name"
              required
              placeholder="e.g. RiceApps"
              {...form.getInputProps("name")}
            />

            <Textarea
              label="Description"
              placeholder="What does your organization do?"
              minRows={3}
              autosize
              {...form.getInputProps("description")}
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
