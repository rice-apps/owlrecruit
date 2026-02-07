"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "submission", label: "Submission" },
  { id: "files", label: "Files" },
  { id: "summary", label: "Summary" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ApplicantTabs() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentTab = (searchParams.get("tab") as TabId) || "submission";

  const createTabUrl = (tabId: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="border-b border-gray-200">
      <nav className="flex gap-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={createTabUrl(tab.id)}
            className={cn(
              "py-3 px-1 text-sm font-medium border-b-2 transition-colors",
              currentTab === tab.id
                ? "border-cyan-500 text-cyan-600"
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

export type { TabId };
