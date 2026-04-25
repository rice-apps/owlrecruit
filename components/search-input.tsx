"use client";

import { SearchMd, Sliders01 } from "@untitled-ui/icons-react";
import { ActionIcon, Group, TextInput } from "@mantine/core";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showFilter?: boolean;
  onFilterClick?: () => void;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  showFilter = false,
  onFilterClick,
}: SearchInputProps) {
  return (
    <Group
      gap="xs"
      style={{
        background: "white",
        border: "1px solid var(--mantine-color-gray-3)",
        borderRadius: "var(--mantine-radius-md)",
        padding: "0.375rem 0.5rem",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <SearchMd
        width={18}
        height={18}
        style={{ color: "var(--mantine-color-gray-5)", flexShrink: 0 }}
      />
      <TextInput
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        variant="unstyled"
        size="sm"
        style={{ flex: 1 }}
        styles={{ input: { fontSize: 16 } }}
      />
      {showFilter && (
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          onClick={onFilterClick}
        >
          <Sliders01 width={18} height={18} />
        </ActionIcon>
      )}
    </Group>
  );
}
