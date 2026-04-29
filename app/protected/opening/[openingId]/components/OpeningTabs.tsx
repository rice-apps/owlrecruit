"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { TabBar } from "@/components/tab-bar";

const allTabs = [
  { id: "overview", label: "Overview" },
  { id: "applicants", label: "Applicants" },
  { id: "questions", label: "Questions" },
  { id: "upload", label: "Upload Data" },
] as const;

type TabId = (typeof allTabs)[number]["id"];

interface OpeningTabsProps {
  useNativeForm: boolean;
  isAdmin: boolean;
  isMember: boolean;
}

export function OpeningTabs({ isAdmin, isMember }: OpeningTabsProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentTab = (searchParams.get("tab") as TabId) || "overview";

  const tabs = allTabs.filter((t) => {
    if (t.id === "upload") return isAdmin;
    if (t.id === "questions") return isAdmin;
    if (t.id === "applicants") return isMember;
    return true;
  });

  const buildHref = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    return `${pathname}?${params.toString()}`;
  };

  return <TabBar tabs={tabs} currentTab={currentTab} buildHref={buildHref} />;
}
