"use client";

import dynamic from "next/dynamic";
import { Box, Text, Stack, Title } from "@mantine/core";

// Google Identity Services modifies the DOM before React hydration when the
// script is cached — disable SSR to avoid the hydration mismatch entirely.
const SignUpGoogleBtn = dynamic(
  () => import("@/app/auth/sign-up/sign-up-google"),
  { ssr: false },
);

export default function Home() {
  return (
    <Box
      style={{
        minHeight: "100vh",
        position: "relative",
        background:
          "linear-gradient(to bottom, var(--mantine-color-white) 0%, #c8f5f2 100%)",
      }}
    >
      {/* Top-left logo */}
      <Box
        style={{
          position: "absolute",
          top: "var(--mantine-spacing-xl)",
          left: "var(--mantine-spacing-xl)",
        }}
      >
        <Text fw={600} size="lg" c="dark.8" style={{ lineHeight: 1 }}>
          owl recruit
          <Text component="span" c="owlTeal.5">
            .
          </Text>
        </Text>
      </Box>

      {/* Center content */}
      <Stack
        align="center"
        justify="center"
        style={{ minHeight: "100vh" }}
        gap="xl"
      >
        <Title
          order={1}
          fw={700}
          c="dark.8"
          ta="center"
          style={{ fontSize: "3rem", lineHeight: 1.15, maxWidth: 560 }}
        >
          The full recruitment journey.{" "}
          <span style={{ display: "block" }}>In one place.</span>
        </Title>
        <SignUpGoogleBtn />
      </Stack>
    </Box>
  );
}
