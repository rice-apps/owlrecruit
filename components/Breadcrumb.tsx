"use client";

import Link from "next/link";
import { Paper, Breadcrumbs, Anchor, Text } from "@mantine/core";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <Paper radius="xl" shadow="xs" px="xl" py="sm" bg="white">
      <Breadcrumbs
        styles={{
          separator: { color: "var(--mantine-color-gray-4)" },
        }}
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          if (isLast || !item.href) {
            return (
              <Text key={i} size="sm" fw={isLast ? 600 : 400} c="dark.7">
                {item.label}
              </Text>
            );
          }
          return (
            <Anchor
              key={i}
              component={Link}
              href={item.href}
              size="sm"
              c="dark.4"
              style={{ textDecoration: "none" }}
            >
              {item.label}
            </Anchor>
          );
        })}
      </Breadcrumbs>
    </Paper>
  );
}
