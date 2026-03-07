"use client";

import { useState } from "react";
import { ChevronDown, UsersPlus, X } from "@untitled-ui/icons-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { EligibleReviewer } from "@/components/opening-form/types";

interface ReviewerSelectorProps {
  eligibleReviewers: EligibleReviewer[];
  selectedReviewers: string[];
  onChange: (reviewers: string[]) => void;
}

function getReviewerName(reviewer: EligibleReviewer): string {
  if (Array.isArray(reviewer.users)) {
    return (
      reviewer.users[0]?.name || reviewer.users[0]?.email || "Unknown User"
    );
  }
  return reviewer.users?.name || reviewer.users?.email || "Unknown User";
}

function getReviewerEmail(reviewer: EligibleReviewer): string {
  if (Array.isArray(reviewer.users)) {
    return reviewer.users[0]?.email || "";
  }
  return reviewer.users?.email || "";
}

export function ReviewerSelector({
  eligibleReviewers,
  selectedReviewers,
  onChange,
}: ReviewerSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const removeReviewer = (userId: string) => {
    onChange(selectedReviewers.filter((id) => id !== userId));
  };

  const toggleReviewer = (userId: string) => {
    if (selectedReviewers.includes(userId)) {
      onChange(selectedReviewers.filter((id) => id !== userId));
    } else {
      onChange([...selectedReviewers, userId]);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium uppercase tracking-wide text-gray-700">
        Assign Reviewers
      </Label>

      <div className="flex flex-wrap gap-2">
        {selectedReviewers.length > 0 ? (
          selectedReviewers.map((userId) => {
            const reviewer = eligibleReviewers.find(
              (item) => item.user_id === userId,
            );
            if (!reviewer) return null;

            return (
              <button
                key={userId}
                type="button"
                onClick={() => removeReviewer(userId)}
                className="flex items-center gap-2 rounded-full border-2 border-gray-200 bg-white py-2 pl-4 pr-3 text-gray-900 shadow-sm transition-all hover:border-gray-300 hover:shadow"
              >
                <span className="text-sm font-medium">
                  {getReviewerName(reviewer)}
                </span>
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            );
          })
        ) : (
          <p className="py-2 text-sm text-gray-500">No reviewers assigned</p>
        )}
      </div>

      {eligibleReviewers.length > 0 && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between gap-2"
            onClick={(e) => {
              e.preventDefault();
              setIsDropdownOpen(!isDropdownOpen);
            }}
          >
            <div className="flex items-center gap-2">
              <UsersPlus className="h-4 w-4" />
              Add Reviewer
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </Button>

          <div
            className={`${isDropdownOpen ? "" : "hidden"} max-h-48 overflow-y-auto rounded-lg border`}
          >
            {eligibleReviewers.map((reviewer) => {
              const isSelected = selectedReviewers.includes(reviewer.user_id);

              return (
                <button
                  key={reviewer.id}
                  type="button"
                  onClick={() => toggleReviewer(reviewer.user_id)}
                  className={`flex w-full items-center justify-between border-b p-3 transition-colors last:border-b-0 hover:bg-gray-50 ${
                    isSelected ? "bg-owl-purple/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded"
                    />
                    <div className="text-left">
                      <p className="text-sm font-medium">
                        {getReviewerName(reviewer)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getReviewerEmail(reviewer)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs uppercase text-gray-500">
                    {reviewer.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
