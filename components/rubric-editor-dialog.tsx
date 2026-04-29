"use client";

import { useState } from "react";
import { notifications } from "@mantine/notifications";
import {
  Modal,
  Button,
  TextInput,
  NumberInput,
  Group,
  Stack,
  Alert,
  ActionIcon,
  Text,
} from "@mantine/core";
import { AlertCircle, Plus, Trash01 } from "@untitled-ui/icons-react";
import type { RubricItem } from "@/components/opening-form/types";

interface RubricEditorDialogProps {
  orgId: string;
  openingId: string;
  initialRubric: RubricItem[];
  trigger: React.ReactNode;
  onSuccess: (updatedRubric: RubricItem[]) => void;
}

export function RubricEditorDialog({
  orgId,
  openingId,
  initialRubric,
  trigger,
  onSuccess,
}: RubricEditorDialogProps) {
  const [open, setOpen] = useState(false);
  const [rubric, setRubric] = useState<RubricItem[]>(initialRubric);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setRubric(initialRubric);
    setError(null);
    setOpen(true);
  };

  const handleSave = async () => {
    setError(null);

    if (rubric.some((r) => !r.name.trim())) {
      setError("All skills must have a name.");
      return;
    }
    if (rubric.some((r) => Number(r.max_val) <= 0)) {
      setError("Max score must be greater than 0.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/org/${orgId}/openings/${openingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubric }),
      });

      if (!res.ok) {
        throw new Error("Failed to save rubric");
      }

      onSuccess(rubric);
      setOpen(false);
    } catch {
      notifications.show({ color: "red", message: "Failed to save changes." });
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <span onClick={handleOpen} style={{ cursor: "pointer" }}>
        {trigger}
      </span>

      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title="Edit Scoring Rubric"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Define the skills and maximum scores for evaluating candidates.
          </Text>

          <Stack gap="xs">
            {rubric.length > 0 && (
              <Group gap="xs">
                <Text size="xs" c="dimmed" style={{ flex: 1 }}>
                  Skill Name
                </Text>
                <Text size="xs" c="dimmed" style={{ width: 80 }}>
                  Max Score
                </Text>
                <div style={{ width: 36 }} />
              </Group>
            )}
            {rubric.map((item, index) => (
              <Group key={index} gap="xs" align="flex-start">
                <TextInput
                  style={{ flex: 1 }}
                  value={item.name}
                  onChange={(e) => {
                    const next = [...rubric];
                    next[index] = {
                      ...next[index],
                      name: e.currentTarget.value,
                    };
                    setRubric(next);
                  }}
                  placeholder="e.g. Communication"
                />
                <NumberInput
                  style={{ width: 80 }}
                  min={1}
                  value={item.max_val}
                  onChange={(val) => {
                    const next = [...rubric];
                    next[index] = { ...next[index], max_val: Number(val) || 0 };
                    setRubric(next);
                  }}
                />
                <ActionIcon
                  variant="subtle"
                  color="red"
                  mt={6}
                  onClick={() =>
                    setRubric(rubric.filter((_, i) => i !== index))
                  }
                >
                  <Trash01 width={16} height={16} />
                </ActionIcon>
              </Group>
            ))}
          </Stack>

          <Button
            variant="outline"
            leftSection={<Plus width={16} height={16} />}
            onClick={() =>
              setRubric([...rubric, { name: "", max_val: 10, description: "" }])
            }
            style={{ borderStyle: "dashed" }}
          >
            Add Skill
          </Button>

          {error && (
            <Alert color="red" icon={<AlertCircle width={16} height={16} />}>
              {error}
            </Alert>
          )}

          <Group
            justify="flex-end"
            pt="xs"
            style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}
          >
            <Button variant="default" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={isSaving}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
