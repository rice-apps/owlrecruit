"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronRight,
  Plus,
  Trash01,
  GridDotsVerticalCenter,
} from "@untitled-ui/icons-react";
import { parseQuestionText, encodeQuestionText } from "@/lib/question-utils";
import type { FieldType } from "@/lib/question-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Question {
  id: string;
  question_text: string;
  is_required: boolean | null;
  sort_order: number | null;
}

interface DraftQuestion {
  /** Temp id for new questions not yet saved, or DB id for existing ones */
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
// Sortable question card
// ---------------------------------------------------------------------------

function SortableQuestionCard({
  q,
  index,
  onChange,
  onDelete,
}: {
  q: DraftQuestion;
  index: number;
  onChange: (updated: DraftQuestion) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: q.tempId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const needsOptions = q.type === "select" || q.type === "checkbox";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-gray-200 rounded-lg p-4 bg-white space-y-3"
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-2 cursor-grab text-gray-400 hover:text-gray-600 shrink-0"
          aria-label="Drag to reorder"
        >
          <GridDotsVerticalCenter className="w-4 h-4" />
        </button>

        <div className="flex-1 space-y-2">
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-400 shrink-0">Q{index + 1}</span>
            <Input
              value={q.label}
              onChange={(e) => onChange({ ...q, label: e.target.value })}
              placeholder="Question text"
              className="flex-1"
            />
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            <select
              value={q.type}
              onChange={(e) =>
                onChange({
                  ...q,
                  type: e.target.value as FieldType,
                  options: [],
                })
              }
              className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white"
            >
              {FIELD_TYPES.map((ft) => (
                <option key={ft.value} value={ft.value}>
                  {ft.label}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={q.is_required}
                onChange={(e) =>
                  onChange({ ...q, is_required: e.target.checked })
                }
                className="w-3.5 h-3.5"
              />
              Required
            </label>
          </div>

          {/* Options editor for select/checkbox */}
          {needsOptions && (
            <div className="space-y-1.5 pl-1">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex gap-1.5 items-center">
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const next = [...q.options];
                      next[oi] = e.target.value;
                      onChange({ ...q, options: next });
                    }}
                    placeholder={`Option ${oi + 1}`}
                    className="text-sm h-8"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = q.options.filter((_, i) => i !== oi);
                      onChange({ ...q, options: next });
                    }}
                    className="text-gray-400 hover:text-red-500"
                    aria-label="Remove option"
                  >
                    <Trash01 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => onChange({ ...q, options: [...q.options, ""] })}
                className="text-xs text-owl-purple hover:underline"
              >
                + Add option
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="mt-1 text-gray-400 hover:text-red-500 shrink-0"
          aria-label="Delete question"
        >
          <Trash01 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Google Forms mode panel
// ---------------------------------------------------------------------------

function GoogleFormsMode({
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
    <div className="py-8 space-y-4">
      <p className="text-sm text-gray-500">
        Paste your Google Forms link below. Applicants will be directed to this
        URL, and you can upload responses via the Upload Data tab.
      </p>
      <div className="flex gap-2 items-center max-w-xl">
        <Input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://docs.google.com/forms/..."
          type="url"
        />
        <Button
          size="sm"
          onClick={saveLink}
          disabled={saving || link === applicationLink}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
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

  // Mode: null/empty = native form, URL = Google Forms
  const isNativeForm = !applicationLink;
  const [switchingMode, setSwitchingMode] = useState(false);

  // Builder state
  const [isEditMode, setIsEditMode] = useState(false);
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const toggleMode = async (toNative: boolean) => {
    setSwitchingMode(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("openings")
        .update({
          application_link: toNative ? null : "",
        })
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

  const handleQuestionClick = (questionId: string) => {
    setSelectedQuestionId(
      selectedQuestionId === questionId ? null : questionId,
    );
  };

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

  // ---------------------------------------------------------------------------
  // Builder helpers
  // ---------------------------------------------------------------------------

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setDraftQuestions((items) => {
        const oldIndex = items.findIndex((i) => i.tempId === active.id);
        const newIndex = items.findIndex((i) => i.tempId === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">
        <p>Loading questions...</p>
      </div>
    );
  }

  // Mode toggle bar (shared between edit & view)
  const modeToggle = (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500">Mode:</span>
      <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => !isNativeForm && toggleMode(true)}
          disabled={switchingMode}
          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
            isNativeForm
              ? "bg-owl-purple text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Native Form
        </button>
        <button
          type="button"
          onClick={() => isNativeForm && toggleMode(false)}
          disabled={switchingMode}
          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
            !isNativeForm
              ? "bg-owl-purple text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Google Forms
        </button>
      </div>
    </div>
  );

  // Edit mode (native form only)
  if (isEditMode) {
    return (
      <div className="py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Edit Form</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditMode(false);
                setSaveError(null);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={saveForm} disabled={saving}>
              {saving ? "Saving…" : "Save Form"}
            </Button>
          </div>
        </div>

        {saveError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
            {saveError}
          </p>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={draftQuestions.map((q) => q.tempId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {draftQuestions.map((q, i) => (
                <SortableQuestionCard
                  key={q.tempId}
                  q={q}
                  index={i}
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
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button
          variant="outline"
          size="sm"
          onClick={addQuestion}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Question
        </Button>
      </div>
    );
  }

  // View mode
  return (
    <div className="py-4 space-y-1">
      <div className="flex items-center justify-between mb-2">
        {modeToggle}
        {isNativeForm && (
          <Button variant="outline" size="sm" onClick={enterEditMode}>
            Edit Form
          </Button>
        )}
      </div>

      {!isNativeForm ? (
        <GoogleFormsMode
          applicationLink={applicationLink ?? ""}
          openingId={openingId}
        />
      ) : questions.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <p>
            No questions configured. Click &ldquo;Edit Form&rdquo; to build your
            form.
          </p>
        </div>
      ) : (
        questions.map((question, index) => {
          const { label } = parseQuestionText(question.question_text);
          const responses = getResponsesForQuestion(question.question_text);
          const isExpanded = selectedQuestionId === question.id;

          return (
            <div key={question.id}>
              <div
                className="py-3 px-2 hover:bg-gray-50 transition-colors cursor-pointer rounded-sm border-b border-gray-100"
                onClick={() => handleQuestionClick(question.id)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      Question {index + 1} of {questions.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-medium">{label}</h2>
                      {question.is_required && (
                        <span className="text-xs text-red-600">*</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-5 w-5 text-gray-400 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  />
                </div>
              </div>

              {isExpanded && (
                <div className="py-3 px-4 bg-gray-50/50 space-y-3">
                  {responses.length > 0 ? (
                    responses.map((response, idx) => (
                      <div
                        key={idx}
                        className="py-3 px-4 bg-white/80 backdrop-blur-sm rounded-lg text-sm text-gray-800 shadow-sm hover:shadow-md transition-shadow"
                      >
                        {String(response)}
                      </div>
                    ))
                  ) : (
                    <div className="py-3 text-sm text-gray-400 text-center italic">
                      No responses yet
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
