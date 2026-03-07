"use client";

import { useState } from "react";
import { Trash01 } from "@untitled-ui/icons-react";
import { Input } from "@/components/ui/input";
import type { RubricItem } from "@/components/opening-form/types";

interface RubricEditorProps {
  rubric: RubricItem[];
  onChange: (rubric: RubricItem[]) => void;
}

export function RubricEditor({ rubric, onChange }: RubricEditorProps) {
  const [rubricOpen, setRubricOpen] = useState(Boolean(rubric.length));

  const updateItem = (index: number, patch: Partial<RubricItem>) => {
    const updated = [...rubric];
    updated[index] = { ...updated[index], ...patch };
    onChange(updated);
  };

  const removeItem = (index: number) => {
    onChange(rubric.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([...rubric, { name: "", max_val: 10, description: "" }]);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => {
          setRubricOpen(!rubricOpen);
          if (!rubricOpen && rubric.length === 0) {
            onChange([{ name: "", max_val: 10, description: "" }]);
          }
        }}
        className="text-sm font-medium text-owl-purple transition-colors hover:text-owl-purple/80"
      >
        {rubricOpen ? "Hide Rubric" : "Add Rubric"}
      </button>

      {rubricOpen && (
        <div className="space-y-3 rounded-xl border p-5">
          <div className="grid grid-cols-[1fr_140px_2fr_32px] items-end gap-3">
            <div>
              <p className="text-sm font-semibold">
                Criteria<span className="text-red-500">*</span>
              </p>
              <p className="text-xs text-gray-400">
                i.e. &quot;Experience, Teamwork&quot;
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">
                Max Score<span className="text-red-500">*</span>
              </p>
              <p className="text-xs text-gray-400">Highest rating</p>
            </div>
            <div>
              <p className="text-sm font-semibold">Description</p>
              <p className="text-xs text-gray-400">
                Describe this criterion more
              </p>
            </div>
            <div />
          </div>

          <div className="space-y-2">
            {rubric.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_140px_2fr_32px] items-center gap-3"
              >
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(index, { name: e.target.value })}
                  placeholder="e.g. Teamwork"
                  className="h-9 text-sm"
                />
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={item.max_val}
                  onChange={(e) =>
                    updateItem(index, {
                      max_val:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                  className="h-9 text-sm"
                />
                <Input
                  value={item.description}
                  onChange={(e) =>
                    updateItem(index, { description: e.target.value })
                  }
                  placeholder="Describe this criterion..."
                  className="h-9 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-gray-300 transition-colors hover:text-red-400"
                >
                  <Trash01 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-semibold text-gray-700">
              Total Score&nbsp;
              <span className="font-normal text-gray-400">
                {rubric.reduce(
                  (sum, item) => sum + (Number(item.max_val) || 0),
                  0,
                )}
              </span>
            </span>
            <button
              type="button"
              onClick={addItem}
              className="text-sm font-medium text-owl-purple transition-colors hover:text-owl-purple/80"
            >
              Add new criterion +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
