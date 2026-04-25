"use client";

import dynamic from "next/dynamic";
import { Box, Stack, Text, Title } from "@mantine/core";

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
        padding: "28px",
        background: "var(--mantine-color-white)",
      }}
    >
      <Box
        style={{
          minHeight: "calc(100vh - 56px)",
          borderRadius: "20px",
          position: "relative",
          background:
            "linear-gradient(to bottom, var(--mantine-color-white) 0%, #7de5e0 100%)",
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
          <Text
            fw={700}
            c="dark.8"
            style={{ lineHeight: 1.1, fontSize: "1.25rem" }}
          >
            <span style={{ display: "block" }}>owl</span>
            <span style={{ display: "block" }}>
              recruit
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "var(--mantine-color-owlTeal-5)",
                  marginTop: "4px",
                  marginLeft: "2px",
                  verticalAlign: "middle",
                }}
              />
            </span>
          </Text>
        </Box>

        {/* Center content */}
        <Stack
          align="center"
          justify="center"
          style={{ minHeight: "calc(100vh - 56px)" }}
          gap="xl"
        >
          <Title
            order={1}
            fw={700}
            c="dark.8"
            ta="center"
            style={{ fontSize: "3rem", lineHeight: 1.15 }}
          >
            <span style={{ display: "block" }}>
              The full recruitment journey.
            </span>
            <span style={{ display: "block" }}>In one place.</span>
          </Title>
          <SignUpGoogleBtn />
        </Stack>
      </Box>
    </Box>
  );
}
