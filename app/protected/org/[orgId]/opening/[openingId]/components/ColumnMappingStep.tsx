"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  return (
    <div className="grid grid-cols-3 items-center gap-4">
      <label className="text-sm font-medium text-gray-700">
        {label}{" "}
        {required && (
          <>
            <span className="text-red-500">*</span>{" "}
            <span className="text-gray-400 font-normal">(required)</span>
          </>
        )}
      </label>
      <div className="col-span-2">
        <Select
          value={value}
          onValueChange={(val) => onUpdateMapping(field, val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select column" />
          </SelectTrigger>
          <SelectContent>
            {getAvailableColumns(field).map((header) => (
              <SelectItem key={header} value={header}>
                {header}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
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
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Select Application Columns
        </h2>
        <p className="text-gray-500">
          Match your CSV columns with the preset columns.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Key Information</h3>
          <div className="space-y-4 max-w-md">
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
            <MappingSelect
              label="Year"
              field="year"
              value={columnMappings.year}
              getAvailableColumns={getAvailableColumns}
              onUpdateMapping={onUpdateMapping}
            />
            <MappingSelect
              label="Major"
              field="major"
              value={columnMappings.major}
              getAvailableColumns={getAvailableColumns}
              onUpdateMapping={onUpdateMapping}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold text-gray-900">Questions</h3>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <button className="text-sm text-cyan-600 font-medium hover:text-cyan-700 hover:underline">
                  Add question
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Question</DialogTitle>
                  <DialogDescription>
                    Enter the question text and map it to a CSV column.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="question" className="mb-2 block">
                    Question
                  </Label>
                  <Input
                    id="question"
                    placeholder="e.g. What is your GPA?"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAdd();
                    }}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAdd}
                    className="bg-cyan-500 hover:bg-cyan-600"
                  >
                    Add Question
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {customQuestions.length > 0 && (
            <div className="space-y-4 max-w-md">
              {customQuestions.map((q) => (
                <div key={q.id} className="grid grid-cols-3 items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">
                    {q.text}
                  </label>
                  <div className="col-span-2 flex gap-2">
                    <Select
                      value={columnMappings[q.id]}
                      onValueChange={(val) => onUpdateMapping(q.id, val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableColumns(q.id).map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onDeleteQuestion(q.id)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-8">
        <Button variant="outline" onClick={onBack} className="w-24">
          Back
        </Button>
        <Button
          onClick={onNext}
          className="w-24 bg-cyan-500 hover:bg-cyan-600"
          disabled={!isStep3Valid}
        >
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </>
  );
}
