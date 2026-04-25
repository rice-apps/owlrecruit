import type { ReactNode } from "react";
import { Card, Group, Stack, Text } from "@mantine/core";

type SectionShellProps = {
  id: string;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function SectionShell({
  id,
  title,
  actions,
  children,
}: SectionShellProps) {
  return (
    <Card component="section" id={id} radius="lg" shadow="sm" p="xl">
      <Group justify="space-between" align="center" mb="md">
        <Text fw={600} size="lg">
          {title}
        </Text>
        {actions && <>{actions}</>}
      </Group>
      <Stack gap="md">{children}</Stack>
    </Card>
  );
}
