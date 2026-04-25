"use client";

import { useState, useEffect, useCallback } from "react";
import { notifications } from "@mantine/notifications";
import { logger } from "@/lib/logger";
import { RubricEditorDialog } from "@/components/rubric-editor-dialog";
import {
  Box,
  Button,
  Group,
  Loader,
  NumberInput,
  Stack,
  Text,
} from "@mantine/core";

interface Rubric {
  name: string;
  max_val: number;
}

interface SkillsScoringPanelProps {
  orgId: string;
  openingId: string;
  applicantId: string;
  isAdmin: boolean;
}

export function SkillsScoringPanel({
  orgId,
  openingId,
  applicantId,
  isAdmin,
}: SkillsScoringPanelProps) {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loadingRubrics, setLoadingRubrics] = useState(true);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [savingScore, setSavingScore] = useState(false);

  useEffect(() => {
    const fetchRubrics = async () => {
      setLoadingRubrics(true);
      try {
        const res = await fetch(`/api/org/${orgId}/openings/${openingId}`);
        if (res.ok) {
          const json = await res.json();
          const opening = json.data ?? json;
          if (opening?.rubric) {
            setRubrics(opening.rubric);
          }
        }
      } catch (error) {
        logger.error("Error fetching rubrics:", error);
      } finally {
        setLoadingRubrics(false);
      }
    };

    fetchRubrics();
  }, [openingId, orgId]);

  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/org/${orgId}/applications/${applicantId}/reviews`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.myScoreSkills) {
          setScores(data.myScoreSkills);
        }
      }
    } catch (error) {
      logger.error("Error fetching scores:", error);
    }
  }, [orgId, applicantId]);

  useEffect(() => {
    fetchScores();
  }, [applicantId, fetchScores]);

  const handleSaveScore = async () => {
    setSavingScore(true);
    try {
      const res = await fetch(
        `/api/org/${orgId}/applications/${applicantId}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scoreSkills: scores }),
        },
      );

      if (!res.ok) {
        logger.warn("Failed to save score");
        notifications.show({ color: "red", message: "Failed to save score." });
      } else {
        notifications.show({ color: "green", message: "Score saved!" });
      }
    } catch (e) {
      logger.error("Error saving score", e);
      notifications.show({ color: "red", message: "Error saving score." });
    } finally {
      setSavingScore(false);
    }
  };

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxTotalScore = rubrics.reduce((a, b) => a + b.max_val, 0);

  return (
    <Stack gap="md" p="md">
      <Box
        p="lg"
        style={{
          border: "1px solid var(--mantine-color-gray-2)",
          borderRadius: "var(--mantine-radius-md)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <Group justify="space-between" mb="lg">
          <Text fw={500} c="dimmed">
            Skills
          </Text>
          <Text fw={500} c="dimmed">
            Your Score
          </Text>
        </Group>

        <Stack gap="lg">
          {loadingRubrics ? (
            <Box ta="center" py="md">
              <Loader size="sm" />
            </Box>
          ) : rubrics.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="md">
              No rubrics defined for this opening.
            </Text>
          ) : (
            rubrics.map((rubric) => (
              <Group key={rubric.name} justify="space-between" align="center">
                <Text size="sm" fw={600}>
                  {rubric.name}
                </Text>
                <Group gap="xs" align="center">
                  <NumberInput
                    min={0}
                    max={rubric.max_val}
                    value={scores[rubric.name] ?? ""}
                    onChange={(val) => {
                      const newScores = { ...scores };
                      if (val === "" || val === undefined) {
                        delete newScores[rubric.name];
                      } else {
                        const n = Number(val);
                        if (!isNaN(n) && n >= 0 && n <= rubric.max_val) {
                          newScores[rubric.name] = n;
                        }
                      }
                      setScores(newScores);
                    }}
                    size="sm"
                    style={{ width: 72 }}
                    styles={{ input: { textAlign: "center" } }}
                  />
                  <Text
                    size="sm"
                    c="dimmed"
                    fw={500}
                    style={{ width: 32, textAlign: "right" }}
                  >
                    / {rubric.max_val}
                  </Text>
                </Group>
              </Group>
            ))
          )}
        </Stack>

        <Box
          mt="xl"
          pt="md"
          style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}
        >
          <Group justify="space-between" mb="md">
            <Text size="sm" fw={600}>
              Total Score:
            </Text>
            <Group gap="xs">
              <Text size="sm" fw={600}>
                {totalScore}
              </Text>
              <Text size="sm" c="dimmed" fw={500}>
                / {maxTotalScore}
              </Text>
            </Group>
          </Group>
          <Button
            fullWidth
            loading={savingScore}
            onClick={handleSaveScore}
            color="dark"
            radius="xl"
          >
            Submit rubric
          </Button>
        </Box>
      </Box>

      {isAdmin && (
        <Group justify="flex-end">
          <RubricEditorDialog
            orgId={orgId}
            openingId={openingId}
            initialRubric={rubrics}
            onSuccess={(updatedRubric) => setRubrics(updatedRubric)}
            trigger={
              <Button variant="subtle" size="xs" color="owlTeal">
                Rubric Details
              </Button>
            }
          />
        </Group>
      )}
    </Stack>
  );
}
