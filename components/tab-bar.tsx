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
    <nav className="border-b border-gray-200" aria-label="Tabs">
      <div className="flex gap-8">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={buildHref(tab.id)}
            className={cn(
              "-mb-px inline-flex items-center border-b pb-3 text-base font-semibold transition-colors",
              currentTab === tab.id
                ? "border-owl-purple text-owl-purple"
                : "border-transparent text-gray-500 hover:text-gray-700",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
