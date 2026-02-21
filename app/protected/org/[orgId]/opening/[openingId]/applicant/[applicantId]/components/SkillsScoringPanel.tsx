"use client";

import { useState, useEffect, useCallback } from "react";
import { RubricEditorDialog } from "@/components/rubric-editor-dialog";
import { Loader2 } from "lucide-react";

interface Rubric {
  name: string;
  max_val: number;
}

interface SkillsScoringPanelProps {
  orgId: string;
  openingId: string;
  applicantId: string;
  isAdmin: boolean;
  onToast: (message: string, type: "success" | "error") => void;
}

export function SkillsScoringPanel({
  orgId,
  openingId,
  applicantId,
  isAdmin,
  onToast,
}: SkillsScoringPanelProps) {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loadingRubrics, setLoadingRubrics] = useState(true);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [savingScore, setSavingScore] = useState(false);

  useEffect(() => {
    const fetchRubrics = async () => {
      setLoadingRubrics(true);
      try {
        const res = await fetch(`/api/org/${orgId}/openings`);
        if (res.ok) {
          const openings = await res.json();
          const currentOpening = openings.find(
            (o: { id: string }) => o.id === openingId,
          );
          if (currentOpening?.rubrics) {
            setRubrics(currentOpening.rubrics);
          }
        }
      } catch (error) {
        console.error("Error fetching rubrics:", error);
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
      console.error("Error fetching scores:", error);
    }
  }, [orgId, applicantId]);

  useEffect(() => {
    fetchScores();
  }, [applicantId, fetchScores]);

  const updateScore = (skill: string, value: string, maxVal: number) => {
    const num = parseFloat(value);
    const newScores = { ...scores };

    if (!isNaN(num) && num >= 0 && num <= maxVal) {
      newScores[skill] = num;
    } else if (value === "") {
      delete newScores[skill];
    }

    setScores(newScores);
  };

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
        console.warn("Failed to save score");
        onToast("Failed to save score", "error");
      } else {
        onToast("Score successfully saved!", "success");
      }
    } catch (e) {
      console.error("Error saving score", e);
      onToast("Error saving score", "error");
    } finally {
      setSavingScore(false);
    }
  };

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxTotalScore = rubrics.reduce((a, b) => a + b.max_val, 0);

  return (
    <div className="p-4">
      <div className="border rounded-xl p-6 shadow-sm bg-card">
        <div className="flex justify-between items-center mb-6">
          <span className="text-muted-foreground font-medium">Skills</span>
          <span className="text-muted-foreground font-medium">Your Score</span>
        </div>

        <div className="flex flex-col gap-6">
          {loadingRubrics ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : rubrics.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No rubrics defined for this opening.
            </p>
          ) : (
            rubrics.map((rubric) => (
              <div
                key={rubric.name}
                className="flex items-center justify-between"
              >
                <span className="font-semibold text-sm">{rubric.name}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={rubric.max_val}
                    className="w-16 h-9 border rounded-[10px] text-center text-sm focus:outline-none focus:ring-1 focus:ring-cyan-600 bg-white"
                    value={scores[rubric.name] ?? ""}
                    onChange={(e) =>
                      updateScore(rubric.name, e.target.value, rubric.max_val)
                    }
                  />
                  <span className="text-muted-foreground text-sm font-medium w-8 text-right">
                    / {rubric.max_val}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 pt-4 border-t">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-sm">Total Score:</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">
                {totalScore}
              </span>
              <span className="text-muted-foreground text-sm font-medium">
                {" "}
                / {maxTotalScore}
              </span>
            </div>
          </div>
          <button
            onClick={handleSaveScore}
            disabled={savingScore}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {savingScore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Submit Score"
            )}
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="mt-4 flex justify-end">
          <RubricEditorDialog
            orgId={orgId}
            openingId={openingId}
            initialRubric={rubrics}
            onSuccess={(updatedRubric) => setRubrics(updatedRubric)}
            trigger={
              <button className="text-cyan-600 text-sm hover:underline">
                Rubric Details
              </button>
            }
          />
        </div>
      )}
    </div>
  );
}
