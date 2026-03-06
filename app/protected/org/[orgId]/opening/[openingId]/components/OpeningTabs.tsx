"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { TabBar } from "@/components/tab-bar";

const tabs = [
  { id: "applicants", label: "Applicants" },
  { id: "questions", label: "Questions" },
  { id: "overview", label: "Overview" },
  { id: "upload", label: "Upload Data" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function OpeningTabs() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentTab = (searchParams.get("tab") as TabId) || "applicants";

  const buildHref = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    return `${pathname}?${params.toString()}`;
  };

  return <TabBar tabs={tabs} currentTab={currentTab} buildHref={buildHref} />;
}

export type { TabId };
