"use client";

import { TextInput } from "@mantine/core";
import { SearchMd } from "@untitled-ui/icons-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: SearchInputProps) {
  return (
    <TextInput
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      placeholder={placeholder}
      leftSection={<SearchMd width={16} height={16} />}
      radius="md"
    />
  );
}
