"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface Rubric {
  name: string;
  max_val: number;
}

interface RubricEditorDialogProps {
  openingId: string;
  initialRubric: Rubric[];
  trigger: React.ReactNode;
  onSuccess: (updatedRubric: Rubric[]) => void;
}

export function RubricEditorDialog({
  openingId,
  initialRubric,
  trigger,
  onSuccess,
}: RubricEditorDialogProps) {
  const [open, setOpen] = useState(false);
  const [rubric, setRubric] = useState<Rubric[]>(initialRubric);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setRubric(initialRubric); // Reset on open
      setError(null);
    }
    setOpen(isOpen);
  };

  const handleAddSkill = () => {
    setRubric([...rubric, { name: "", max_val: 10 }]);
  };

  const handleUpdateSkill = (
    index: number,
    field: keyof Rubric,
    value: string | number,
  ) => {
    const newRubric = [...rubric];
    if (field === "max_val") {
      newRubric[index] = { ...newRubric[index], [field]: Number(value) };
    } else {
      newRubric[index] = { ...newRubric[index], [field]: value as string };
    }
    setRubric(newRubric);
  };

  const handleRemoveSkill = (index: number) => {
    setRubric(rubric.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setError(null);

    // Validation
    if (rubric.some((r) => !r.name.trim())) {
      setError("All skills must have a name.");
      return;
    }
    if (rubric.some((r) => r.max_val <= 0)) {
      setError("Max score must be greater than 0.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/openings/${openingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubric }),
      });

      if (!res.ok) {
        throw new Error("Failed to save rubric");
      }

      onSuccess(rubric);
      setOpen(false);
    } catch (err) {
      console.error("Error saving rubric:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Scoring Rubric</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Define the skills and maximum scores for evaluating candidates.
          </p>

          <div className="space-y-3">
            {rubric.map((item, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  {index === 0 && (
                    <Label className="text-xs text-muted-foreground">
                      Skill Name
                    </Label>
                  )}
                  <Input
                    value={item.name}
                    onChange={(e) =>
                      handleUpdateSkill(index, "name", e.target.value)
                    }
                    placeholder="e.g. Communication"
                  />
                </div>
                <div className="w-20 space-y-1">
                  {index === 0 && (
                    <Label className="text-xs text-muted-foreground">Max</Label>
                  )}
                  <Input
                    type="number"
                    min="1"
                    value={item.max_val}
                    onChange={(e) =>
                      handleUpdateSkill(index, "max_val", e.target.value)
                    }
                  />
                </div>
                <div className={index === 0 ? "pt-6" : ""}>
                   <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveSkill(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={handleAddSkill}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Skill
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
