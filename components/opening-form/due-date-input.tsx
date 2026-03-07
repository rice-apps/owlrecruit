"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DueDateInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function DueDateInput({ value, onChange }: DueDateInputProps) {
  const [editingDue, setEditingDue] = useState(false);

  if (!editingDue) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setEditingDue(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setEditingDue(true);
        }}
        className="flex cursor-pointer items-center gap-2 text-gray-400"
      >
        <span className="underline decoration-gray-200">
          {value
            ? new Date(value).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })
            : "Select date"}
        </span>
        <span className="underline decoration-gray-200">
          {value
            ? new Date(value).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })
            : "Select time"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-auto items-center gap-2">
      <Input
        id="closes_date"
        type="date"
        value={value ? value.slice(0, 10) : ""}
        onChange={(e) => {
          const date = e.target.value;
          const time = value ? value.slice(11, 16) : "23:59";
          onChange(date ? `${date}T${time}` : "");
        }}
        className="h-10 w-auto text-sm"
      />
      <Input
        id="closes_time"
        type="time"
        value={value ? value.slice(11, 16) : "23:59"}
        onChange={(e) => {
          const time = e.target.value;
          const date = value
            ? value.slice(0, 10)
            : new Date().toISOString().slice(0, 10);
          onChange(date ? `${date}T${time}` : "");
        }}
        className="h-10 w-auto text-sm"
      />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setEditingDue(false)}
      >
        Done
      </Button>
    </div>
  );
}
