"use client";

import Link from "next/link";

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
    <nav
      aria-label="Tabs"
      style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}
    >
      <div style={{ display: "flex", gap: "2rem" }}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={buildHref(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                paddingBottom: "0.75rem",
                marginBottom: "-1px",
                fontSize: "0.875rem",
                fontWeight: 500,
                borderBottom: isActive
                  ? "2px solid var(--mantine-color-dark-8)"
                  : "2px solid transparent",
                color: isActive
                  ? "var(--mantine-color-dark-8)"
                  : "var(--mantine-color-gray-6)",
                transition: "color 150ms, border-color 150ms",
                textDecoration: "none",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
