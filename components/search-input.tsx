"use client";

import { SearchMd, Sliders01 } from "@untitled-ui/icons-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-[#C5C5C5] shadow-sm">
      <SearchMd className="text-gray-400 ml-2" />
      <Input
        placeholder={placeholder}
        className="border-0 shadow-none focus-visible:ring-0 text-base"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {showFilter && (
        <Button variant="ghost" size="icon" onClick={onFilterClick}>
          <Sliders01 className="w-5 h-5 text-gray-500" />
        </Button>
      )}
    </div>
  );
}
