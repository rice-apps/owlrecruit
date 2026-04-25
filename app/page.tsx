"use client";

import dynamic from "next/dynamic";
import { Center, Stack, Title, Text } from "@mantine/core";

// Google Identity Services modifies the DOM before React hydration when the
// script is cached — disable SSR to avoid the hydration mismatch entirely.
const SignUpGoogleBtn = dynamic(
  () => import("@/app/auth/sign-up/sign-up-google"),
  { ssr: false },
);

export default function Home() {
  return (
    <Center h="100vh">
      <Stack align="center" gap="md" maw={400} ta="center" px="md">
        <Title order={1} fw={700}>
          Welcome to OwlRecruit.
        </Title>
        <Text c="dimmed" size="lg">
          Rice University&apos;s club recruitment platform
        </Text>
        <SignUpGoogleBtn />
      </Stack>
    </Center>
  );
}
