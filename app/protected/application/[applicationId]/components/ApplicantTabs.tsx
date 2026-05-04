"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { TabBar } from "@/components/tab-bar";

const tabs = [
  { id: "summary", label: "Summary" },
  { id: "interview", label: "Interview" },
  { id: "submission", label: "Submission" },
  { id: "files", label: "Files" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ApplicantTabs() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentTab = (searchParams.get("tab") as TabId) || "summary";

  const buildHref = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    return `${pathname}?${params.toString()}`;
  };

  return <TabBar tabs={tabs} currentTab={currentTab} buildHref={buildHref} />;
}
