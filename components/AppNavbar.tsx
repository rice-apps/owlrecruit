"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppShellNavbar,
  Avatar,
  Tooltip,
  UnstyledButton,
  Divider,
  Stack,
  Box,
  ActionIcon,
  Text,
} from "@mantine/core";
import {
  SearchMd,
  File02,
  Users01,
  Bell01,
  LayoutLeft,
  LogOut01,
} from "@untitled-ui/icons-react";
import type { OrgWithRole } from "@/types/app";

interface AppNavbarProps {
  orgs: OrgWithRole[];
  user: { name: string; email: string; avatarUrl?: string };
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active: boolean;
  collapsed: boolean;
}

function NavItem({ icon, label, href, active, collapsed }: NavItemProps) {
  const color = active
    ? "var(--mantine-color-owlTeal-4)"
    : "var(--mantine-color-dark-2)";

  const button = (
    <UnstyledButton
      component={Link}
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: "var(--mantine-spacing-sm)",
        width: "100%",
        height: 44,
        paddingInline: collapsed ? 0 : "var(--mantine-spacing-sm)",
        borderRadius: "var(--mantine-radius-md)",
        color,
        transition: "color 150ms",
      }}
    >
      {icon}
      {!collapsed && (
        <Text size="sm" fw={500} c="inherit" style={{ whiteSpace: "nowrap" }}>
          {label}
        </Text>
      )}
    </UnstyledButton>
  );

  if (collapsed) {
    return (
      <Tooltip label={label} position="right" withArrow>
        {button}
      </Tooltip>
    );
  }
  return button;
}

export function AppNavbar({ orgs, user, collapsed, onToggle }: AppNavbarProps) {
  const pathname = usePathname();

  const initials =
    user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  const orgHref =
    orgs.length > 0 ? `/protected/org/${orgs[0].id}` : "/protected/createorg";

  return (
    <AppShellNavbar
      bg="dark.8"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: collapsed ? "center" : "stretch",
        paddingTop: "var(--mantine-spacing-md)",
        paddingBottom: "var(--mantine-spacing-md)",
        paddingInline: collapsed ? 0 : "var(--mantine-spacing-xs)",
        gap: 0,
        overflow: "hidden",
      }}
    >
      {/* Toggle button */}
      <Tooltip
        label="Toggle sidebar"
        position="right"
        withArrow
        disabled={!collapsed}
      >
        <ActionIcon
          variant="transparent"
          color="dark.2"
          size="lg"
          mb="md"
          aria-label="Toggle sidebar"
          onClick={onToggle}
          style={{ alignSelf: collapsed ? "center" : "flex-start" }}
        >
          <LayoutLeft width={20} height={20} />
        </ActionIcon>
      </Tooltip>

      {/* Nav items */}
      <Stack
        gap="xs"
        style={{ flex: 1 }}
        align={collapsed ? "center" : "stretch"}
      >
        <NavItem
          icon={<SearchMd width={20} height={20} />}
          label="Discover"
          href="/protected/discover"
          active={pathname.startsWith("/protected/discover")}
          collapsed={collapsed}
        />
        <NavItem
          icon={<File02 width={20} height={20} />}
          label="My Applications"
          href="/protected/applications"
          active={pathname.startsWith("/protected/applications")}
          collapsed={collapsed}
        />
        <NavItem
          icon={<Users01 width={20} height={20} />}
          label="My Organizations"
          href={orgHref}
          active={pathname.startsWith("/protected/org")}
          collapsed={collapsed}
        />
        <NavItem
          icon={<Bell01 width={20} height={20} />}
          label="Notifications"
          href="#"
          active={false}
          collapsed={collapsed}
        />
      </Stack>

      {/* Bottom: divider + sign-out + avatar */}
      <Box style={{ width: "100%" }} px="xs">
        <Divider color="dark.6" my="xs" />
      </Box>

      {/* Sign out */}
      <form
        action="/auth/signout"
        method="post"
        style={{ width: collapsed ? "auto" : "100%" }}
      >
        <Tooltip
          label="Sign out"
          position="right"
          withArrow
          disabled={!collapsed}
        >
          <UnstyledButton
            type="submit"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: "var(--mantine-spacing-sm)",
              width: collapsed ? 44 : "100%",
              height: 44,
              paddingInline: collapsed ? 0 : "var(--mantine-spacing-sm)",
              borderRadius: "var(--mantine-radius-md)",
              color: "var(--mantine-color-dark-2)",
              transition: "color 150ms",
            }}
          >
            <LogOut01 width={20} height={20} />
            {!collapsed && (
              <Text
                size="sm"
                fw={500}
                c="inherit"
                style={{ whiteSpace: "nowrap" }}
              >
                Sign out
              </Text>
            )}
          </UnstyledButton>
        </Tooltip>
      </form>

      {/* Profile avatar + name */}
      <Tooltip label="Profile" position="right" withArrow disabled={!collapsed}>
        <UnstyledButton
          component={Link}
          href="/protected/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--mantine-spacing-sm)",
            width: collapsed ? "auto" : "100%",
            paddingInline: collapsed ? 0 : "var(--mantine-spacing-xs)",
            paddingBlock: "var(--mantine-spacing-xs)",
            borderRadius: "var(--mantine-radius-md)",
          }}
        >
          <Avatar
            src={user.avatarUrl}
            radius="xl"
            size={36}
            color="owlTeal"
            style={{ flexShrink: 0 }}
          >
            {initials}
          </Avatar>
          {!collapsed && (
            <Text
              size="sm"
              fw={500}
              c="dark.2"
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.name}
            </Text>
          )}
        </UnstyledButton>
      </Tooltip>
    </AppShellNavbar>
  );
}
