"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: readonly Tab[];
  currentTab: string;
  buildHref: (id: string) => string;
}

export function TabBar({ tabs, currentTab, buildHref }: TabBarProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex gap-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={buildHref(tab.id)}
            className={cn(
              "py-3 px-1 text-sm font-medium border-b-2 transition-colors",
              currentTab === tab.id
                ? "border-owl-purple text-owl-purple"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
