"use client";

import { useState } from "react";
import {
  Drawer,
  Stack,
  Text,
  Checkbox,
  Select,
  Button,
  Group,
  Divider,
} from "@mantine/core";

export interface FilterState {
  statuses: string[];
  datePosted: "all" | "7days" | "30days";
  deadline: "all" | "closing-soon" | "no-deadline";
  sort: "recent" | "closing-soon" | "org-name";
}

const DEFAULT_FILTERS: FilterState = {
  statuses: ["open"],
  datePosted: "all",
  deadline: "all",
  sort: "recent",
};

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
}

export function FilterDrawer({
  open,
  onOpenChange,
  filters,
  onApply,
}: FilterDrawerProps) {
  const [temp, setTemp] = useState<FilterState>(filters);

  const toggleStatus = (status: string) => {
    setTemp((prev) => {
      const has = prev.statuses.includes(status);
      const next = has
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status];
      return { ...prev, statuses: next.length === 0 ? ["open"] : next };
    });
  };

  const handleApply = () => {
    onApply(temp);
    onOpenChange(false);
  };

  const handleReset = () => {
    setTemp(DEFAULT_FILTERS);
    onApply(DEFAULT_FILTERS);
    onOpenChange(false);
  };

  return (
    <Drawer
      opened={open}
      onClose={() => onOpenChange(false)}
      title="Filter Openings"
      position="right"
      size="sm"
    >
      <Stack gap="lg">
        <Stack gap="xs">
          <Text fw={600} size="sm">
            Status
          </Text>
          <Checkbox
            label="Open (actively accepting)"
            checked={temp.statuses.includes("open")}
            onChange={() => toggleStatus("open")}
          />
          <Checkbox
            label="Closed (no longer accepting)"
            checked={temp.statuses.includes("closed")}
            onChange={() => toggleStatus("closed")}
          />
        </Stack>

        <Divider />

        <Select
          label="Date Posted"
          value={temp.datePosted}
          onChange={(v) =>
            setTemp((p) => ({
              ...p,
              datePosted: (v ?? "all") as FilterState["datePosted"],
            }))
          }
          data={[
            { value: "all", label: "Anytime" },
            { value: "7days", label: "Last 7 days" },
            { value: "30days", label: "Last 30 days" },
          ]}
        />

        <Select
          label="Application Deadline"
          value={temp.deadline}
          onChange={(v) =>
            setTemp((p) => ({
              ...p,
              deadline: (v ?? "all") as FilterState["deadline"],
            }))
          }
          data={[
            { value: "all", label: "All" },
            { value: "closing-soon", label: "Closing soon (< 7 days)" },
            { value: "no-deadline", label: "No deadline" },
          ]}
        />

        <Select
          label="Sort By"
          value={temp.sort}
          onChange={(v) =>
            setTemp((p) => ({
              ...p,
              sort: (v ?? "recent") as FilterState["sort"],
            }))
          }
          data={[
            { value: "recent", label: "Recently posted" },
            { value: "closing-soon", label: "Closing soon" },
            { value: "org-name", label: "Organization name (A–Z)" },
          ]}
        />

        <Divider />

        <Group grow>
          <Button variant="default" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </Group>
      </Stack>
    </Drawer>
  );
}
