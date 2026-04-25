"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Accordion,
  ActionIcon,
  Alert,
  Avatar,
  Box,
  Button,
  Group,
  Loader,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Plus, Trash01 } from "@untitled-ui/icons-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

interface QAPair {
  question: string;
  answer: string;
}

interface InterviewRecord {
  id: string;
  interviewer_id: string;
  form_responses: QAPair[];
  round_number: number;
  created_at: string | null;
  updated_at: string | null;
  interviewer:
    | { id: string; name: string | null }
    | { id: string; name: string | null }[]
    | null;
}

interface InterviewTabProps {
  orgId: string;
  applicationId: string;
}

function getInterviewerName(
  interviewer: InterviewRecord["interviewer"],
): string {
  if (!interviewer) return "Unknown";
  const u = Array.isArray(interviewer) ? interviewer[0] : interviewer;
  return u?.name || "Unknown";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function InterviewTab({ orgId, applicationId }: InterviewTabProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [records, setRecords] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [myQA, setMyQA] = useState<QAPair[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/org/${orgId}/applications/${applicationId}/interviews`,
      );
      if (!res.ok) throw new Error("Failed to fetch interview records");
      const json = await res.json();
      const data: InterviewRecord[] = json.data ?? json;
      setRecords(data);
    } catch (err) {
      logger.error("Error fetching interviews:", err);
      setError("Unable to load interview records.");
    } finally {
      setLoading(false);
    }
  }, [orgId, applicationId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Sync myQA when records or currentUserId changes
  useEffect(() => {
    if (!currentUserId) return;
    const mine = records.find((r) => r.interviewer_id === currentUserId);
    if (mine) {
      setMyQA(
        mine.form_responses.length > 0
          ? mine.form_responses
          : [{ question: "", answer: "" }],
      );
    }
  }, [records, currentUserId]);

  const myRecord = records.find((r) => r.interviewer_id === currentUserId);
  const otherRecords = records.filter(
    (r) => r.interviewer_id !== currentUserId,
  );

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch(
        `/api/org/${orgId}/applications/${applicationId}/interviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            form_responses: [{ question: "", answer: "" }],
          }),
        },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Failed to create interview record");
      }
      await fetchRecords();
    } catch (err) {
      logger.error("Error creating interview record:", err);
      notifications.show({
        color: "red",
        message:
          err instanceof Error
            ? err.message
            : "Failed to create interview record",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!myRecord) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/org/${orgId}/applications/${applicationId}/interviews/${myRecord.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ form_responses: myQA }),
        },
      );
      if (!res.ok) throw new Error("Failed to save");
      notifications.show({ color: "green", message: "Interview notes saved." });
    } catch (err) {
      logger.error("Error saving interview:", err);
      notifications.show({
        color: "red",
        message: "Failed to save interview notes.",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateQA = (
    index: number,
    field: "question" | "answer",
    value: string,
  ) => {
    setMyQA((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addQA = () =>
    setMyQA((prev) => [...prev, { question: "", answer: "" }]);

  const removeQA = (index: number) =>
    setMyQA((prev) => prev.filter((_, i) => i !== index));

  if (loading) {
    return (
      <Box ta="center" py="xl">
        <Loader size="sm" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert color="red" mb="md">
        {error}
      </Alert>
    );
  }

  return (
    <Stack gap="xl">
      {/* My interview record */}
      <Stack gap="md">
        <Text fw={600} size="lg">
          My Interview Notes
        </Text>

        {!myRecord ? (
          <Button
            variant="light"
            onClick={handleCreate}
            loading={creating}
            leftSection={<Plus width={16} height={16} />}
          >
            Start my interview record
          </Button>
        ) : (
          <Stack gap="sm">
            {myQA.map((pair, index) => (
              <Box
                key={index}
                p="md"
                style={{
                  border: "1px solid var(--mantine-color-gray-2)",
                  borderRadius: "var(--mantine-radius-md)",
                  background: "var(--mantine-color-gray-0)",
                }}
              >
                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed" fw={500}>
                    Q&amp;A {index + 1}
                  </Text>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => removeQA(index)}
                    disabled={myQA.length === 1}
                  >
                    <Trash01 width={14} height={14} />
                  </ActionIcon>
                </Group>
                <TextInput
                  placeholder="Question"
                  value={pair.question}
                  onChange={(e) =>
                    updateQA(index, "question", e.currentTarget.value)
                  }
                  mb="xs"
                  size="sm"
                />
                <Textarea
                  placeholder="Answer / Notes"
                  value={pair.answer}
                  onChange={(e) =>
                    updateQA(index, "answer", e.currentTarget.value)
                  }
                  minRows={2}
                  autosize
                  size="sm"
                />
              </Box>
            ))}

            <Group>
              <Button
                variant="subtle"
                size="xs"
                leftSection={<Plus width={14} height={14} />}
                onClick={addQA}
              >
                Add Q&amp;A pair
              </Button>
              <Button size="xs" onClick={handleSave} loading={saving}>
                Save notes
              </Button>
            </Group>
          </Stack>
        )}
      </Stack>

      {/* Other interviewers' records */}
      {otherRecords.length > 0 && (
        <Stack gap="md">
          <Text fw={600} size="lg">
            Other Interviewers
          </Text>
          <Accordion variant="separated">
            {otherRecords.map((record) => {
              const name = getInterviewerName(record.interviewer);
              return (
                <Accordion.Item key={record.id} value={record.id}>
                  <Accordion.Control>
                    <Group gap="sm">
                      <Avatar size={28} radius="xl" color="violet">
                        {getInitials(name)}
                      </Avatar>
                      <Text size="sm" fw={500}>
                        {name}
                      </Text>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    {record.form_responses.length === 0 ? (
                      <Text size="sm" c="dimmed">
                        No notes recorded yet.
                      </Text>
                    ) : (
                      <Stack gap="sm">
                        {record.form_responses.map((pair, idx) => (
                          <Box key={idx}>
                            {pair.question && (
                              <Text size="sm" fw={600} mb={2}>
                                {pair.question}
                              </Text>
                            )}
                            <Text
                              size="sm"
                              c="dimmed"
                              style={{ whiteSpace: "pre-wrap" }}
                            >
                              {pair.answer || "—"}
                            </Text>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Accordion.Panel>
                </Accordion.Item>
              );
            })}
          </Accordion>
        </Stack>
      )}

      {records.length === 0 && (
        <Text c="dimmed" size="sm" ta="center" py="xl">
          No interview records yet.
        </Text>
      )}
    </Stack>
  );
}
