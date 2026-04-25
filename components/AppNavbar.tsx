"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppShell,
  NavLink,
  Accordion,
  Avatar,
  Text,
  Group,
  Stack,
  ActionIcon,
  Divider,
  Box,
  UnstyledButton,
} from "@mantine/core";
import {
  SearchMd,
  Folder,
  AlignJustify,
  Plus,
  LogOut01,
} from "@untitled-ui/icons-react";
import type { OrgWithRole } from "@/types/app";

interface AppNavbarProps {
  orgs: OrgWithRole[];
  user: { name: string; email: string };
}

export function AppNavbar({ orgs, user }: AppNavbarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname.startsWith(path);

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <AppShell.Navbar
      p="md"
      style={{ display: "flex", flexDirection: "column", gap: 0 }}
    >
      {/* Logo */}
      <Box mb="lg">
        <UnstyledButton component={Link} href="/protected/discover">
          <Text fw={700} size="xl" c="owlPurple.5">
            owlrecruit.
          </Text>
        </UnstyledButton>
      </Box>

      {/* Nav links */}
      <Stack gap={4} style={{ flex: 1 }}>
        <NavLink
          component={Link}
          href="/protected/discover"
          label="Discover"
          leftSection={<SearchMd width={18} height={18} />}
          active={isActive("/protected/discover")}
          variant="subtle"
          fw={500}
        />
        <NavLink
          component={Link}
          href="/protected/applications"
          label="My Applications"
          leftSection={<Folder width={18} height={18} />}
          active={isActive("/protected/applications")}
          variant="subtle"
          fw={500}
        />

        {/* Organizations accordion */}
        <Accordion
          variant="default"
          defaultValue={isActive("/protected/org") ? "orgs" : undefined}
          styles={{
            item: { border: "none" },
            control: { padding: "6px 12px", borderRadius: 6 },
          }}
        >
          <Accordion.Item value="orgs">
            <Accordion.Control icon={<AlignJustify width={18} height={18} />}>
              <Text size="sm" fw={500}>
                My Organizations
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack
                gap={2}
                pl="sm"
                style={{ borderLeft: "2px solid var(--mantine-color-gray-2)" }}
              >
                {orgs.map((org) => (
                  <NavLink
                    key={org.id}
                    component={Link}
                    href={`/protected/org/${org.id}`}
                    label={org.name}
                    active={pathname.startsWith(`/protected/org/${org.id}`)}
                    variant="subtle"
                    style={{ borderRadius: 6 }}
                  />
                ))}
                <NavLink
                  component={Link}
                  href="/protected/createorg"
                  label="Add new"
                  leftSection={<Plus width={14} height={14} />}
                  c="owlPurple.5"
                  variant="subtle"
                  style={{ borderRadius: 6 }}
                />
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Stack>

      {/* User footer */}
      <Box>
        <Divider mb="sm" />
        <Group justify="space-between" wrap="nowrap">
          <UnstyledButton
            component={Link}
            href="/protected/profile"
            style={{ flex: 1, minWidth: 0 }}
          >
            <Group wrap="nowrap" gap="sm">
              <Avatar radius="xl" size="sm" color="owlPurple">
                {initial}
              </Avatar>
              <Box style={{ minWidth: 0 }}>
                <Text size="sm" fw={500} truncate>
                  {user.name}
                </Text>
                <Text size="xs" c="dimmed" truncate>
                  {user.email}
                </Text>
              </Box>
            </Group>
          </UnstyledButton>
          <form action="/auth/signout" method="post">
            <ActionIcon
              type="submit"
              variant="subtle"
              color="gray"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut01 width={16} height={16} />
            </ActionIcon>
          </form>
        </Group>
      </Box>
    </AppShell.Navbar>
  );
}
