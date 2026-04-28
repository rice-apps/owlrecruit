"use client";

import * as React from "react";
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Collapse,
  Group,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  FilterLines,
  Plus,
  SearchMd,
  Trash01,
} from "@untitled-ui/icons-react";
import type { FieldType } from "@/lib/question-utils";
import { encodeQuestionText, parseQuestionText } from "@/lib/question-utils";
import { createClient } from "@/lib/supabase/client";

interface Question {
  id: string;
  question_text: string;
  is_required: boolean | null;
  sort_order: number | null;
}

interface Application {
  id: string;
  form_responses: Record<string, unknown>;
  applicant_id: string;
  user: {
    name: string;
    email: string;
  } | null;
  applicant: {
    name: string;
    net_id: string;
  } | null;
}

interface DraftQuestion {
  tempId: string;
  dbId: string | null;
  label: string;
  type: FieldType;
  options: string[];
  is_required: boolean;
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
    <Card radius="lg" shadow="sm" withBorder={false} p="md">
      <Stack gap="sm">
        <Group gap="sm" align="flex-start">
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
                  color="owlTeal"
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

export function QuestionsTab({ openingId, orgId }: QuestionsTabProps) {
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [draftQuestions, setDraftQuestions] = React.useState<DraftQuestion[]>(
    [],
  );
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const [selectedQuestionId, setSelectedQuestionId] = React.useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [anonymousView, setAnonymousView] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      const { data: questionsData } = await supabase
        .from("questions")
        .select("*")
        .eq("opening_id", openingId)
        .order("sort_order", { ascending: true });

      const { data: applicationsData } = (await supabase
        .from("applications")
        .select(
          `
          id,
          applicant_id,
          form_responses,
          user:user_id (name, email),
          applicant:applicant_id (name, net_id)
        `,
        )
        .eq("opening_id", openingId)) as { data: Application[] | null };

      if (questionsData) setQuestions(questionsData);
      if (applicationsData) setApplications(applicationsData);

      setLoading(false);
    };

    fetchData();
  }, [openingId]);

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
        <Text c="dimmed">Loading questions...</Text>
      </Box>
    );
  }

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
  const getResponsesForQuestion = (questionText: string) => {
    const { label } = parseQuestionText(questionText);
    const filtered = applications
      .filter((app) => {
        const query = searchQuery.toLowerCase();
        if (!query) return true;
        const userData = app.user || app.applicant;
        const userEmail =
          app.user?.email || `${app.applicant?.net_id}@rice.edu`;
        return (
          userData?.name?.toLowerCase().includes(query) ||
          userEmail?.toLowerCase().includes(query) ||
          app.applicant?.net_id?.toLowerCase().includes(query)
        );
      })
      .map((app) => {
        const userData = app.user || app.applicant;
        const responses = app.form_responses || {};
        return {
          applicantName: anonymousView
            ? `Applicant ${applications.indexOf(app) + 1}`
            : userData?.name || "Unknown",
          response: responses[label],
          email: app.user?.email || `${app.applicant?.net_id}@rice.edu`,
        };
      })
      .filter(
        ({ response }) =>
          response !== undefined && response !== null && response !== "",
      );
    return filtered;
  };

  return (
    <Stack gap="md">
      {/* Toolbar */}
      <Group gap="sm" wrap="nowrap" align="center">
        <TextInput
          placeholder="Search applicants by name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          leftSection={<SearchMd width={16} height={16} />}
          radius="xl"
          style={{ flex: 1 }}
        />
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" c="dimmed" style={{ whiteSpace: "nowrap" }}>
            Anonymous view
          </Text>
          <Switch
            checked={anonymousView}
            onChange={(e) => setAnonymousView(e.currentTarget.checked)}
            size="sm"
          />
        </Group>
        <Group gap={4} wrap="nowrap" style={{ cursor: "pointer" }}>
          <Text size="sm" c="dimmed" style={{ whiteSpace: "nowrap" }}>
            Filter
          </Text>
          <FilterLines width={16} height={16} />
        </Group>
        <Button color="dark" radius="xl" size="sm">
          Submit results
        </Button>
        <Button variant="outline" size="sm" onClick={enterEditMode}>
          Edit Form
        </Button>
      </Group>

      {/* Questions list */}
      {questions.length === 0 ? (
        <Box py="xl" ta="center">
          <Text c="dimmed" size="sm">
            No questions configured.
          </Text>
        </Box>
      ) : (
        <Stack gap={0}>
          {questions.map((question, index) => {
            const { label } = parseQuestionText(question.question_text);
            const responses = getResponsesForQuestion(question.question_text);
            const isExpanded = selectedQuestionId === question.id;

            return (
              <Box
                key={question.id}
                style={{
                  borderBottom: "1px solid var(--mantine-color-gray-2)",
                }}
              >
                <Box
                  py="md"
                  px="md"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setSelectedQuestionId(isExpanded ? null : question.id)
                  }
                >
                  <Group justify="space-between" gap="md">
                    <Group gap="xs" align="center" style={{ flex: 1 }}>
                      <Text size="sm" fw={500}>
                        {index + 1}. {label}
                      </Text>
                      {question.is_required && (
                        <Text size="xs" c="red">
                          *
                        </Text>
                      )}
                    </Group>
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
                  <Stack gap="xs" px="md" pb="md">
                    {responses.length > 0 ? (
                      responses.map((item, idx) => (
                        <Box
                          key={idx}
                          p="sm"
                          style={{
                            background: "var(--mantine-color-gray-0)",
                            borderRadius: "var(--mantine-radius-md)",
                            fontSize: 14,
                          }}
                        >
                          <Text size="sm" fw={500} mb="xs">
                            {item.applicantName}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {String(item.response)}
                          </Text>
                        </Box>
                      ))
                    ) : (
                      <Text
                        size="sm"
                        c="dimmed"
                        ta="center"
                        py="sm"
                        fs="italic"
                      >
                        No responses yet
                      </Text>
                    )}
                  </Stack>
                </Collapse>
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
