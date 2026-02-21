"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Rubric {
  name: string;
  max_val: number;
  description: string;
}

interface RubricSettingsFormProps {
  orgId: string;
  openingId: string;
  initialRubric: Rubric[];
}

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
      updated[index] = { ...updated[index], [field]: Number(value) };
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

    if (rubric.some((r) => !r.name.trim())) {
      setError("All criteria must have a name.");
      return;
    }
    if (rubric.some((r) => r.max_val <= 0)) {
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
          <div className="grid grid-cols-[1fr_120px_1fr] gap-4 mb-4">
            <span className="text-sm font-semibold">
              Criteria<span className="text-red-500">*</span>
            </span>
            <span className="text-sm font-semibold">
              Max Score<span className="text-red-500">*</span>
            </span>
            <span className="text-sm font-semibold">Description</span>
          </div>

          {/* Rubric rows */}
          <div className="space-y-3">
            {rubric.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_120px_1fr] gap-4 items-center"
              >
                <Input
                  value={item.name}
                  onChange={(e) => handleUpdate(index, "name", e.target.value)}
                  placeholder="e.g. Teamwork"
                />
                <Input
                  type="number"
                  min="1"
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
              </div>
            ))}
          </div>

          {/* Add link */}
          <button
            onClick={handleAdd}
            className="mt-4 text-cyan-600 text-sm font-medium hover:underline"
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
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
}
