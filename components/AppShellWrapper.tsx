"use client";

import { useState } from "react";
import { AppShell, AppShellMain } from "@mantine/core";
import { AppNavbar } from "@/components/AppNavbar";
import type { OrgWithRole } from "@/types/app";

const COLLAPSED_WIDTH = 65;
const EXPANDED_WIDTH = 200;

interface AppShellWrapperProps {
  orgs: OrgWithRole[];
  user: { name: string; email: string; avatarUrl?: string };
  children: React.ReactNode;
}

export function AppShellWrapper({
  orgs,
  user,
  children,
}: AppShellWrapperProps) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <AppShell
      navbar={{
        width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        breakpoint: "sm",
      }}
      padding="md"
    >
      <AppNavbar
        orgs={orgs}
        user={user}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <AppShellMain bg="gray.1">{children}</AppShellMain>
    </AppShell>
  );
}
