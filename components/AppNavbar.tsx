"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ActionIcon,
  AppShellNavbar,
  Avatar,
  Box,
  Divider,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import {
  Bell01,
  File02,
  LayoutLeft,
  LogOut01,
  Users01,
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
        width: "100%",
        height: 44,
        borderRadius: "var(--mantine-radius-md)",
        color,
        transition: "color 150ms",
      }}
    >
      <Box
        style={{
          width: 65,
          display: "flex",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
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

export function AppNavbar({ user, collapsed, onToggle }: AppNavbarProps) {
  const pathname = usePathname();

  const orgHref = "/protected/orgs";

  return (
    <AppShellNavbar
      bg="dark.8"
      style={{
        display: "flex",
        flexDirection: "column",
        paddingTop: "var(--mantine-spacing-md)",
        paddingBottom: "var(--mantine-spacing-md)",
        gap: 0,
        overflow: "hidden",
      }}
    >
      {/* Toggle button */}
      <Box
        style={{
          width: 65,
          display: "flex",
          justifyContent: "center",
          marginBottom: "var(--mantine-spacing-md)",
          flexShrink: 0,
        }}
      >
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
            aria-label="Toggle sidebar"
            onClick={onToggle}
          >
            <LayoutLeft width={20} height={20} />
          </ActionIcon>
        </Tooltip>
      </Box>

      {/* Nav items */}
      <Stack gap="xs" style={{ flex: 1 }}>
        <NavItem
          icon={
            <Image src="/logo.svg" alt="OwlRecruit" width={20} height={20} />
          }
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
      <form action="/auth/signout" method="post" style={{ width: "100%" }}>
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
              width: "100%",
              height: 44,
              borderRadius: "var(--mantine-radius-md)",
              color: "var(--mantine-color-dark-2)",
              transition: "color 150ms",
            }}
          >
            <Box
              style={{
                width: 65,
                display: "flex",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <LogOut01 width={20} height={20} />
            </Box>
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
            width: "100%",
            paddingBlock: "var(--mantine-spacing-xs)",
            borderRadius: "var(--mantine-radius-md)",
          }}
        >
          <Box
            style={{
              width: 65,
              display: "flex",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Avatar
              src={user.avatarUrl}
              radius="xl"
              size={36}
              color="initials"
              name={user.name}
            />
          </Box>
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
