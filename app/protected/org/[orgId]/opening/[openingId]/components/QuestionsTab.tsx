"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronRight,
  Plus,
  Trash01,
  ArrowUp,
  ArrowDown,
} from "@untitled-ui/icons-react";
import { parseQuestionText, encodeQuestionText } from "@/lib/question-utils";
import type { FieldType } from "@/lib/question-utils";
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Collapse,
  Group,
  Loader,
  Select,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";

interface Question {
  id: string;
  question_text: string;
  is_required: boolean | null;
  sort_order: number | null;
}

interface DraftQuestion {
  tempId: string;
  dbId: string | null;
  label: string;
  type: FieldType;
  options: string[];
  is_required: boolean;
}

interface Application {
  id: string;
  form_responses: Record<string, unknown>;
}

interface QuestionsTabProps {
  openingId: string;
  orgId: string;
  applicationLink: string | null;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Short Answer" },
  { value: "textarea", label: "Long Answer" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkboxes" },
  { value: "url", label: "URL" },
];

// ---------------------------------------------------------------------------
// Question card (edit mode) — up/down buttons instead of drag
// ---------------------------------------------------------------------------

function QuestionCard({
  q,
  index,
  total,
  onChange,
  onDelete,
  onMove,
}: {
  q: DraftQuestion;
  index: number;
  total: number;
  onChange: (updated: DraftQuestion) => void;
  onDelete: () => void;
  onMove: (dir: "up" | "down") => void;
}) {
  const needsOptions = q.type === "select" || q.type === "checkbox";

  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="sm">
        <Group gap="sm" align="flex-start">
          {/* Reorder buttons */}
          <Stack gap={2} style={{ flexShrink: 0 }}>
            <ActionIcon
              variant="subtle"
              size="xs"
              disabled={index === 0}
              onClick={() => onMove("up")}
              aria-label="Move up"
            >
              <ArrowUp width={12} height={12} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              size="xs"
              disabled={index === total - 1}
              onClick={() => onMove("down")}
              aria-label="Move down"
            >
              <ArrowDown width={12} height={12} />
            </ActionIcon>
          </Stack>

          <Stack gap="sm" style={{ flex: 1 }}>
            <Group gap="sm" align="center">
              <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                Q{index + 1}
              </Text>
              <TextInput
                value={q.label}
                onChange={(e) =>
                  onChange({ ...q, label: e.currentTarget.value })
                }
                placeholder="Question text"
                style={{ flex: 1 }}
              />
            </Group>

            <Group gap="sm" wrap="wrap">
              <Select
                data={FIELD_TYPES.map((ft) => ({
                  value: ft.value,
                  label: ft.label,
                }))}
                value={q.type}
                onChange={(val) =>
                  onChange({
                    ...q,
                    type: (val as FieldType) ?? "text",
                    options: [],
                  })
                }
                size="sm"
                style={{ width: 160 }}
              />
              <Checkbox
                label="Required"
                checked={q.is_required}
                onChange={(e) =>
                  onChange({ ...q, is_required: e.currentTarget.checked })
                }
                size="sm"
              />
            </Group>

            {needsOptions && (
              <Stack gap="xs" pl="xs">
                {q.options.map((opt, oi) => (
                  <Group key={oi} gap="xs">
                    <TextInput
                      value={opt}
                      onChange={(e) => {
                        const next = [...q.options];
                        next[oi] = e.currentTarget.value;
                        onChange({ ...q, options: next });
                      }}
                      placeholder={`Option ${oi + 1}`}
                      size="xs"
                      style={{ flex: 1 }}
                    />
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => {
                        const next = q.options.filter((_, i) => i !== oi);
                        onChange({ ...q, options: next });
                      }}
                      aria-label="Remove option"
                    >
                      <Trash01 width={12} height={12} />
                    </ActionIcon>
                  </Group>
                ))}
                <Button
                  variant="subtle"
                  size="xs"
                  color="owlPurple"
                  onClick={() =>
                    onChange({ ...q, options: [...q.options, ""] })
                  }
                >
                  + Add option
                </Button>
              </Stack>
            )}
          </Stack>

          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            onClick={onDelete}
            aria-label="Delete question"
            style={{ flexShrink: 0 }}
          >
            <Trash01 width={16} height={16} />
          </ActionIcon>
        </Group>
      </Stack>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// External link mode panel
// ---------------------------------------------------------------------------

function ExternalLinkMode({
  applicationLink,
  openingId,
}: {
  applicationLink: string;
  openingId: string;
}) {
  const router = useRouter();
  const [link, setLink] = useState(applicationLink);
  const [saving, setSaving] = useState(false);

  const saveLink = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from("openings")
        .update({ application_link: link })
        .eq("id", openingId);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="md" py="lg">
      <Text size="sm" c="dimmed">
        Paste your external application link below. Applicants will be directed
        to this URL, and you can upload responses via the Upload Data tab.
      </Text>
      <Group gap="sm" align="flex-end" style={{ maxWidth: 480 }}>
        <TextInput
          value={link}
          onChange={(e) => setLink(e.currentTarget.value)}
          placeholder="https://docs.google.com/forms/..."
          type="url"
          style={{ flex: 1 }}
        />
        <Button
          size="sm"
          onClick={saveLink}
          loading={saving}
          disabled={link === applicationLink}
        >
          Save
        </Button>
      </Group>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function QuestionsTab({
  openingId,
  orgId,
  applicationLink,
}: QuestionsTabProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );

  const isNativeForm = !applicationLink;
  const [switchingMode, setSwitchingMode] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const toggleMode = async (toNative: boolean) => {
    setSwitchingMode(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("openings")
        .update({ application_link: toNative ? null : "" })
        .eq("id", openingId);
      if (!error) router.refresh();
    } finally {
      setSwitchingMode(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("opening_id", openingId)
        .order("sort_order", { ascending: true });

      const { data: applicationsData, error: applicationsError } =
        await supabase
          .from("applications")
          .select("id, form_responses")
          .eq("opening_id", openingId);

      if (!questionsError && questionsData) setQuestions(questionsData);
      if (!applicationsError && applicationsData)
        setApplications(applicationsData);

      setLoading(false);
    };

    fetchData();
  }, [openingId]);

  const getResponsesForQuestion = (questionText: string) => {
    const { label } = parseQuestionText(questionText);
    return applications
      .map((app) => {
        const responses = app.form_responses || {};
        return responses[label];
      })
      .filter(
        (response) =>
          response !== undefined && response !== null && response !== "",
      );
  };

  const enterEditMode = () => {
    setDraftQuestions(
      questions.map((q) => {
        const parsed = parseQuestionText(q.question_text);
        return {
          tempId: q.id,
          dbId: q.id,
          label: parsed.label,
          type: parsed.type,
          options: parsed.options ?? [],
          is_required: q.is_required ?? false,
        };
      }),
    );
    setIsEditMode(true);
  };

  const moveQuestion = (index: number, dir: "up" | "down") => {
    setDraftQuestions((prev) => {
      const next = [...prev];
      const swapIndex = dir === "up" ? index - 1 : index + 1;
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next;
    });
  };

  const addQuestion = () => {
    setDraftQuestions((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        dbId: null,
        label: "",
        type: "text",
        options: [],
        is_required: false,
      },
    ]);
  };

  const saveForm = async () => {
    setSaveError(null);

    const emptyIndex = draftQuestions.findIndex((q) => q.label.trim() === "");
    if (emptyIndex !== -1) {
      setSaveError(`Question ${emptyIndex + 1} has no text.`);
      return;
    }

    setSaving(true);
    try {
      const payload = draftQuestions.map((q) => ({
        question_text: encodeQuestionText(
          q.label.trim(),
          q.type,
          q.options.length > 0 ? q.options : null,
        ),
        is_required: q.is_required,
      }));

      const res = await fetch(
        `/api/org/${orgId}/opening/${openingId}/questions`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: payload }),
        },
      );

      if (!res.ok) {
        const json = await res.json();
        setSaveError(json.error ?? "Failed to save. Please try again.");
        return;
      }

      const json = await res.json();
      setQuestions(json.questions ?? []);
      setIsEditMode(false);
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box py="xl" ta="center">
        <Loader size="sm" />
      </Box>
    );
  }

  const modeControl = (
    <SegmentedControl
      value={isNativeForm ? "native" : "external"}
      onChange={(val) => toggleMode(val === "native")}
      disabled={switchingMode}
      data={[
        { label: "Native Form", value: "native" },
        { label: "External Link", value: "external" },
      ]}
      size="sm"
    />
  );

  // Edit mode
  if (isEditMode) {
    return (
      <Stack gap="md" py="md">
        <Group justify="space-between" align="center">
          <Text size="sm" fw={600} c="dimmed">
            Edit Form
          </Text>
          <Group gap="xs">
            <Button
              variant="default"
              size="sm"
              disabled={saving}
              onClick={() => {
                setIsEditMode(false);
                setSaveError(null);
              }}
            >
              Cancel
            </Button>
            <Button size="sm" loading={saving} onClick={saveForm}>
              Save Form
            </Button>
          </Group>
        </Group>

        {saveError && <Alert color="red">{saveError}</Alert>}

        <Stack gap="xs">
          {draftQuestions.map((q, i) => (
            <QuestionCard
              key={q.tempId}
              q={q}
              index={i}
              total={draftQuestions.length}
              onChange={(updated) =>
                setDraftQuestions((prev) =>
                  prev.map((item) =>
                    item.tempId === updated.tempId ? updated : item,
                  ),
                )
              }
              onDelete={() =>
                setDraftQuestions((prev) =>
                  prev.filter((item) => item.tempId !== q.tempId),
                )
              }
              onMove={(dir) => moveQuestion(i, dir)}
            />
          ))}
        </Stack>

        <Button
          variant="outline"
          leftSection={<Plus width={16} height={16} />}
          onClick={addQuestion}
          style={{ borderStyle: "dashed" }}
        >
          Add Question
        </Button>
      </Stack>
    );
  }

  // View mode
  return (
    <Stack gap="sm" py="md">
      <Group justify="space-between" align="center" mb="xs">
        {modeControl}
        {isNativeForm && (
          <Button variant="outline" size="sm" onClick={enterEditMode}>
            Edit Form
          </Button>
        )}
      </Group>

      {!isNativeForm ? (
        <ExternalLinkMode
          applicationLink={applicationLink ?? ""}
          openingId={openingId}
        />
      ) : questions.length === 0 ? (
        <Box py="xl" ta="center">
          <Text c="dimmed" size="sm">
            No questions configured. Click &ldquo;Edit Form&rdquo; to build your
            form.
          </Text>
        </Box>
      ) : (
        questions.map((question, index) => {
          const { label } = parseQuestionText(question.question_text);
          const responses = getResponsesForQuestion(question.question_text);
          const isExpanded = selectedQuestionId === question.id;

          return (
            <Box
              key={question.id}
              style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}
            >
              <Box
                py="sm"
                px="xs"
                style={{ cursor: "pointer" }}
                onClick={() =>
                  setSelectedQuestionId(isExpanded ? null : question.id)
                }
              >
                <Group justify="space-between" gap="md">
                  <Box style={{ flex: 1 }}>
                    <Text size="xs" c="dimmed" mb={4}>
                      Question {index + 1} of {questions.length}
                    </Text>
                    <Group gap="xs" align="center">
                      <Text size="sm" fw={500}>
                        {label}
                      </Text>
                      {question.is_required && (
                        <Text size="xs" c="red">
                          *
                        </Text>
                      )}
                    </Group>
                  </Box>
                  <ChevronRight
                    width={18}
                    height={18}
                    style={{
                      color: "var(--mantine-color-gray-5)",
                      flexShrink: 0,
                      transform: isExpanded ? "rotate(90deg)" : "none",
                      transition: "transform 150ms",
                    }}
                  />
                </Group>
              </Box>

              <Collapse expanded={isExpanded}>
                <Stack gap="xs" px="md" pb="sm">
                  {responses.length > 0 ? (
                    responses.map((response, idx) => (
                      <Box
                        key={idx}
                        p="sm"
                        style={{
                          background: "var(--mantine-color-gray-0)",
                          borderRadius: "var(--mantine-radius-md)",
                          fontSize: 14,
                        }}
                      >
                        {String(response)}
                      </Box>
                    ))
                  ) : (
                    <Text size="sm" c="dimmed" ta="center" py="sm" fs="italic">
                      No responses yet
                    </Text>
                  )}
                </Stack>
              </Collapse>
            </Box>
          );
        })
      )}
    </Stack>
  );
}
