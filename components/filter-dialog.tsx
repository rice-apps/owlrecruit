"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterState {
  statuses: string[];
  datePosted: "all" | "7days" | "30days";
  deadline: "all" | "closing-soon" | "no-deadline";
  sort: "recent" | "closing-soon" | "org-name";
}

interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
}

export function FilterDialog({
  open,
  onOpenChange,
  filters,
  onApply,
}: FilterDialogProps) {
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);

  const handleStatusChange = (status: string, checked: boolean | string) => {
    const isChecked = typeof checked === "boolean" ? checked : checked === "indeterminate" ? false : true;
    if (isChecked) {
      setTempFilters((prev) => ({
        ...prev,
        statuses: [...prev.statuses, status],
      }));
    } else {
      // Prevent deselecting all statuses - automatically reselect "open"
      const newStatuses = tempFilters.statuses.filter((s) => s !== status);
      setTempFilters((prev) => ({
        ...prev,
        statuses: newStatuses.length === 0 ? ["open"] : newStatuses,
      }));
    }
  };

  const handleReset = () => {
    const defaultFilters: FilterState = {
      statuses: ["open"],
      datePosted: "all",
      deadline: "all",
      sort: "recent",
    };
    setTempFilters(defaultFilters);
    onApply(defaultFilters);
  };

  const handleApply = () => {
    onApply(tempFilters);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter Openings</DialogTitle>
          <DialogDescription>
            Refine your search with filters
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Status</Label>
            <div className="space-y-2">
              {["open", "closed"].map((status) => (
                <div key={status} className="flex items-center gap-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={tempFilters.statuses.includes(status)}
                    onCheckedChange={(checked) =>
                      handleStatusChange(status, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`status-${status}`}
                    className="text-sm cursor-pointer capitalize"
                  >
                    {status === "open" && "Open (actively accepting)"}
                    {status === "closed" && "Closed (no longer accepting)"}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Date Posted Filter */}
          <div className="space-y-3">
            <Label htmlFor="date-posted" className="text-base font-semibold">
              Date Posted
            </Label>
            <Select
              value={tempFilters.datePosted}
              onValueChange={(value) =>
                setTempFilters((prev) => ({
                  ...prev,
                  datePosted: value as FilterState["datePosted"],
                }))
              }
            >
              <SelectTrigger id="date-posted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Anytime</SelectItem>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Application Deadline Filter */}
          <div className="space-y-3">
            <Label
              htmlFor="deadline-filter"
              className="text-base font-semibold"
            >
              Application Deadline
            </Label>
            <Select
              value={tempFilters.deadline}
              onValueChange={(value) =>
                setTempFilters((prev) => ({
                  ...prev,
                  deadline: value as FilterState["deadline"],
                }))
              }
            >
              <SelectTrigger id="deadline-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="closing-soon">Closing Soon (&lt; 7 days)</SelectItem>
                <SelectItem value="no-deadline">No Deadline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Options */}
          <div className="space-y-3">
            <Label htmlFor="sort" className="text-base font-semibold">
              Sort By
            </Label>
            <Select
              value={tempFilters.sort}
              onValueChange={(value) =>
                setTempFilters((prev) => ({
                  ...prev,
                  sort: value as FilterState["sort"],
                }))
              }
            >
              <SelectTrigger id="sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Posted</SelectItem>
                <SelectItem value="closing-soon">Closing Soon</SelectItem>
                <SelectItem value="org-name">Organization Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button 
            onClick={handleApply} 
            className="bg-black text-white hover:bg-gray-800"
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
