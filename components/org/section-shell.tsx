import type { ReactNode } from "react";
import { Box, Group, Stack, Text } from "@mantine/core";

type SectionShellProps = {
  id: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function SectionShell({
  id,
  title,
  subtitle,
  actions,
  children,
}: SectionShellProps) {
  return (
    <Box
      component="section"
      id={id}
      tabIndex={-1}
      style={{ scrollMarginTop: "7rem" }}
    >
      <Group
        justify="space-between"
        align="flex-start"
        mb="md"
        gap="md"
        wrap="wrap"
      >
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" mb={subtitle ? 4 : 0}>
            <Box
              w={48}
              h={3}
              style={{
                borderRadius: 999,
                backgroundColor: "var(--mantine-color-red-3)",
              }}
            />
            <Text fw={600} size="xl">
              {title}
            </Text>
          </Group>
          {subtitle && (
            <Text size="sm" c="dimmed">
              {subtitle}
            </Text>
          )}
        </Box>
        {actions && <Box>{actions}</Box>}
      </Group>
      <Stack gap="md">{children}</Stack>
    </Box>
  );
}
