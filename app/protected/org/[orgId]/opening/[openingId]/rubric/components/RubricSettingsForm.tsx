"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loading01, Trash01 } from "@untitled-ui/icons-react";

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

    const normalizedNames = normalizedRubric.map((r) =>
      r.name.toLowerCase(),
    );
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

      if (!res.ok) {
        throw new Error("Failed to save rubric");
      }

      router.back();
    } catch {
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_120px_1fr_32px] gap-4 mb-4">
            <span className="text-sm font-semibold">
              Criteria<span className="text-red-500">*</span>
            </span>
            <span className="text-sm font-semibold">
              Max Score<span className="text-red-500">*</span>
            </span>
            <span className="text-sm font-semibold">Description</span>
            <span />
          </div>

          {/* Rubric rows */}
          <div className="space-y-3">
            {rubric.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_120px_1fr_32px] gap-4 items-center"
              >
                <Input
                  value={item.name}
                  onChange={(e) => handleUpdate(index, "name", e.target.value)}
                  placeholder="e.g. Teamwork"
                />
                <Input
                  type="number"
                  min="1"
                  max={MAX_RUBRIC_SCORE}
                  value={item.max_val}
                  onChange={(e) =>
                    handleUpdate(index, "max_val", e.target.value)
                  }
                />
                <Input
                  value={item.description}
                  onChange={(e) =>
                    handleUpdate(index, "description", e.target.value)
                  }
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() =>
                    setRubric(rubric.filter((_, i) => i !== index))
                  }
                  className="text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Trash01 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add link */}
          <button
            onClick={handleAdd}
            className="mt-4 text-owl-purple text-sm font-medium hover:underline"
          >
            Add
          </button>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="">
          {isSaving && <Loading01 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
}
