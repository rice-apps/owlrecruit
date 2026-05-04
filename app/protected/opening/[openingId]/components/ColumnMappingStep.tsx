"use client";

import { useState } from "react";
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { ChevronRight, X } from "@untitled-ui/icons-react";
import type { ColumnMapping, CustomQuestion } from "./useUploadWizard";

interface ColumnMappingStepProps {
  columnMappings: ColumnMapping;
  customQuestions: CustomQuestion[];
  getAvailableColumns: (currentField: string) => string[];
  isStep3Valid: boolean;
  onUpdateMapping: (key: string, value: string) => void;
  onAddQuestion: (text: string) => void;
  onDeleteQuestion: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}

function MappingSelect({
  label,
  required,
  field,
  value,
  getAvailableColumns,
  onUpdateMapping,
}: {
  label: string;
  required?: boolean;
  field: string;
  value: string;
  getAvailableColumns: (field: string) => string[];
  onUpdateMapping: (key: string, value: string) => void;
}) {
  const columns = getAvailableColumns(field);
  return (
    <Group
      gap="md"
      align="center"
      style={{ display: "grid", gridTemplateColumns: "1fr 2fr" }}
    >
      <Text size="sm" fw={500}>
        {label}{" "}
        {required && (
          <Text span size="sm" c="red">
            *{" "}
            <Text span size="sm" c="dimmed" fw={400}>
              (required)
            </Text>
          </Text>
        )}
      </Text>
      <Select
        placeholder="Select column"
        data={columns.map((c) => ({ value: c, label: c }))}
        value={value || null}
        onChange={(val) => onUpdateMapping(field, val ?? "")}
        clearable={!required}
        size="sm"
      />
    </Group>
  );
}

export function ColumnMappingStep({
  columnMappings,
  customQuestions,
  getAvailableColumns,
  isStep3Valid,
  onUpdateMapping,
  onAddQuestion,
  onDeleteQuestion,
  onNext,
  onBack,
}: ColumnMappingStepProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");

  const handleAdd = () => {
    if (!questionText.trim()) return;
    onAddQuestion(questionText);
    setQuestionText("");
    setIsModalOpen(false);
  };

  return (
    <>
      <Stack gap="xs">
        <Text size="lg" fw={600}>
          Select Application Columns
        </Text>
        <Text c="dimmed" size="sm">
          Match your CSV columns with the preset columns.
        </Text>
      </Stack>

      <Stack gap="xl">
        <Stack gap="md">
          <Text fw={600}>Key Information</Text>
          <Stack gap="sm" style={{ maxWidth: 480 }}>
            <MappingSelect
              label="Name"
              required
              field="name"
              value={columnMappings.name}
              getAvailableColumns={getAvailableColumns}
              onUpdateMapping={onUpdateMapping}
            />
            <MappingSelect
              label="NetID"
              required
              field="netid"
              value={columnMappings.netid}
              getAvailableColumns={getAvailableColumns}
              onUpdateMapping={onUpdateMapping}
            />
          </Stack>
        </Stack>

        <Stack gap="sm">
          <Group gap="sm" align="center">
            <Text fw={600}>Questions</Text>
            <Button
              variant="subtle"
              size="xs"
              color="owlTeal"
              onClick={() => setIsModalOpen(true)}
            >
              Add question
            </Button>
          </Group>

          {customQuestions.length > 0 && (
            <Stack gap="sm" style={{ maxWidth: 480 }}>
              {customQuestions.map((q) => (
                <Group
                  key={q.id}
                  gap="md"
                  align="center"
                  style={{ display: "grid", gridTemplateColumns: "1fr 2fr" }}
                >
                  <Text size="sm" fw={500}>
                    {q.text}
                  </Text>
                  <Group gap="xs">
                    <Select
                      placeholder="Select column"
                      data={getAvailableColumns(q.id).map((c) => ({
                        value: c,
                        label: c,
                      }))}
                      value={columnMappings[q.id] || null}
                      onChange={(val) => onUpdateMapping(q.id, val ?? "")}
                      clearable
                      size="sm"
                      style={{ flex: 1 }}
                    />
                    <ActionIcon
                      variant="default"
                      size="sm"
                      onClick={() => onDeleteQuestion(q.id)}
                      aria-label="Remove question"
                      style={{ flexShrink: 0 }}
                    >
                      <X width={14} height={14} />
                    </ActionIcon>
                  </Group>
                </Group>
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>

      <Group justify="space-between" pt="xl">
        <Button variant="default" onClick={onBack} style={{ width: 96 }}>
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!isStep3Valid}
          rightSection={<ChevronRight width={16} height={16} />}
          style={{ width: 96 }}
          color="dark"
          radius="xl"
        >
          Next
        </Button>
      </Group>

      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Question"
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Enter the question text and map it to a CSV column.
          </Text>
          <TextInput
            label="Question"
            placeholder="e.g. What is your GPA?"
            value={questionText}
            onChange={(e) => setQuestionText(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} color="dark" radius="xl">
              Add Question
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
