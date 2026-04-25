"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Card,
  Group,
  NumberInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { Trash01 } from "@untitled-ui/icons-react";

interface Rubric {
  name: string;
  max_val: number | string;
  description: string;
}

interface RubricSettingsFormProps {
  orgId: string;
  openingId: string;
  initialRubric: Rubric[];
}

const MAX_RUBRIC_SCORE = 1_000_000_000_000;

export function RubricSettingsForm({
  orgId,
  openingId,
  initialRubric,
}: RubricSettingsFormProps) {
  const router = useRouter();
  const [rubric, setRubric] = useState<Rubric[]>(initialRubric);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = (
    index: number,
    field: keyof Rubric,
    value: string | number,
  ) => {
    const updated = [...rubric];
    if (field === "max_val") {
      updated[index] = {
        ...updated[index],
        [field]: value === "" ? "" : Number(value),
      };
    } else {
      updated[index] = { ...updated[index], [field]: value as string };
    }
    setRubric(updated);
  };

  const handleAdd = () => {
    setRubric([...rubric, { name: "", max_val: 10, description: "" }]);
  };

  const handleSave = async () => {
    setError(null);

    const normalizedRubric = rubric.map((r) => ({
      name: r.name.trim(),
      description: r.description.trim(),
      max_val: Number(r.max_val),
    }));

    if (normalizedRubric.some((r) => !r.name)) {
      setError("All criteria must have a name.");
      return;
    }

    const normalizedNames = normalizedRubric.map((r) => r.name.toLowerCase());
    if (new Set(normalizedNames).size !== normalizedNames.length) {
      setError("Criteria names must be unique.");
      return;
    }

    if (normalizedRubric.some((r) => r.max_val <= 0)) {
      setError("Max score must be greater than 0.");
      return;
    }

    if (normalizedRubric.some((r) => r.max_val > MAX_RUBRIC_SCORE)) {
      setError("Max score must be less than or equal to 1,000,000,000,000.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/org/${orgId}/openings/${openingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubric: normalizedRubric }),
      });

      if (!res.ok) throw new Error("Failed to save rubric");

      router.back();
    } catch {
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack gap="lg">
      <Card withBorder radius="md" p="lg">
        {/* Header row */}
        <Box
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 120px 1fr 36px",
            gap: 16,
            marginBottom: 12,
          }}
        >
          <Text size="sm" fw={600}>
            Criteria{" "}
            <Text span c="red">
              *
            </Text>
          </Text>
          <Text size="sm" fw={600}>
            Max Score{" "}
            <Text span c="red">
              *
            </Text>
          </Text>
          <Text size="sm" fw={600}>
            Description
          </Text>
          <Box />
        </Box>

        <Stack gap="sm">
          {rubric.map((item, index) => (
            <Box
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px 1fr 36px",
                gap: 16,
                alignItems: "center",
              }}
            >
              <TextInput
                value={item.name}
                onChange={(e) =>
                  handleUpdate(index, "name", e.currentTarget.value)
                }
                placeholder="e.g. Teamwork"
                size="sm"
              />
              <NumberInput
                min={1}
                max={MAX_RUBRIC_SCORE}
                value={item.max_val === "" ? undefined : Number(item.max_val)}
                onChange={(val) =>
                  handleUpdate(index, "max_val", val as number)
                }
                size="sm"
              />
              <TextInput
                value={item.description}
                onChange={(e) =>
                  handleUpdate(index, "description", e.currentTarget.value)
                }
                placeholder=""
                size="sm"
              />
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => setRubric(rubric.filter((_, i) => i !== index))}
                aria-label="Remove criterion"
              >
                <Trash01 width={16} height={16} />
              </ActionIcon>
            </Box>
          ))}
        </Stack>

        <Button
          variant="subtle"
          color="owlTeal"
          size="xs"
          mt="md"
          onClick={handleAdd}
        >
          Add
        </Button>
      </Card>

      {error && <Alert color="red">{error}</Alert>}

      <Group justify="flex-end" gap="sm">
        <Button variant="default" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button loading={isSaving} onClick={handleSave}>
          Save
        </Button>
      </Group>
    </Stack>
  );
}
