"use client";

import { useState, useCallback, useEffect } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { parseQuestionText } from "@/lib/question-utils";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Group,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";

interface RawQuestion {
  id: string;
  question_text: string;
  is_required: boolean | null;
  sort_order: number | null;
}

interface ApplyFormProps {
  openingId: string;
  title: string;
  description: string;
  orgName: string;
  closesAt: string | null;
  questions: RawQuestion[];
  isAuthenticated: boolean;
  userEmail: string | null;
  alreadyApplied: boolean;
}

// ---------------------------------------------------------------------------
// Google sign-in button
// ---------------------------------------------------------------------------

function SignInForApplyBtn() {
  const router = useRouter();

  const handleSignIn = useCallback(
    async (response: { credential: string }) => {
      const supabase = createClient();
      const { data } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.credential,
      });
      if (data?.user) {
        router.refresh();
      }
    },
    [router],
  );

  useEffect(() => {
    (
      window as unknown as {
        handleApplySignIn: (r: { credential: string }) => Promise<void>;
      }
    ).handleApplySignIn = handleSignIn;
  }, [handleSignIn]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />
      <div
        id="g_id_onload"
        data-client_id="530339823745-p2p8i1r4e6ki8f1ra93aar28n5pil04f.apps.googleusercontent.com"
        data-context="signin"
        data-ux_mode="popup"
        data-callback="handleApplySignIn"
        data-auto_prompt="false"
      />
      <div
        className="g_id_signin"
        data-type="standard"
        data-shape="rectangular"
        data-theme="filled_white"
        data-text="continue_with"
        data-size="large"
        data-logo_alignment="left"
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Field renderer
// ---------------------------------------------------------------------------

function FormField({
  question,
  value,
  onChange,
}: {
  question: {
    label: string;
    type: string;
    options: string[] | null;
    is_required: boolean | null;
  };
  value: string | string[];
  onChange: (v: string | string[]) => void;
}) {
  switch (question.type) {
    case "textarea":
      return (
        <Textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.currentTarget.value)}
          required={question.is_required ?? false}
          minRows={3}
          autosize
        />
      );
    case "select":
      return (
        <Select
          data={(question.options ?? []).map((opt) => ({
            value: opt,
            label: opt,
          }))}
          value={typeof value === "string" ? value : null}
          onChange={(val) => onChange(val ?? "")}
          placeholder="Select an option…"
          required={question.is_required ?? false}
        />
      );
    case "checkbox":
      return (
        <Stack gap="xs">
          {(question.options ?? []).map((opt) => {
            const checked = Array.isArray(value) && value.includes(opt);
            return (
              <Checkbox
                key={opt}
                label={opt}
                checked={checked}
                onChange={() => {
                  const arr = Array.isArray(value) ? [...value] : [];
                  onChange(
                    checked ? arr.filter((v) => v !== opt) : [...arr, opt],
                  );
                }}
              />
            );
          })}
        </Stack>
      );
    case "url":
      return (
        <TextInput
          type="url"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.currentTarget.value)}
          required={question.is_required ?? false}
          placeholder="https://"
        />
      );
    default:
      return (
        <TextInput
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.currentTarget.value)}
          required={question.is_required ?? false}
        />
      );
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ApplyForm({
  openingId,
  title,
  description,
  orgName,
  closesAt,
  questions,
  isAuthenticated,
  userEmail,
  alreadyApplied,
}: ApplyFormProps) {
  const parsedQuestions = questions.map((q) => ({
    ...q,
    ...parseQuestionText(q.question_text),
  }));

  const [formState, setFormState] = useState<Record<string, string | string[]>>(
    () =>
      Object.fromEntries(
        parsedQuestions.map((q) => [q.label, q.type === "checkbox" ? [] : ""]),
      ),
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/openings/${openingId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form_responses: formState }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const json = await res.json();
        setError(json.error ?? "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const header = (
    <Box mb="xl">
      <Text size="sm" c="dimmed" mb={4}>
        {orgName}
      </Text>
      <Text size="xl" fw={700} mb="xs">
        {title}
      </Text>
      {description && (
        <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
          {description}
        </Text>
      )}
      {closesAt && (
        <Text size="xs" c="dimmed" mt="xs">
          Closes {new Date(closesAt).toLocaleDateString()}
        </Text>
      )}
    </Box>
  );

  if (submitted) {
    return (
      <Box>
        {header}
        <Alert color="green" radius="md">
          <Text fw={600} mb={4}>
            Application submitted!
          </Text>
          <Text size="sm">
            You can track your application status on your{" "}
            <a
              href="/protected/applications"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              applications page
            </a>
            .
          </Text>
        </Alert>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box>
        {header}
        <Box
          p="xl"
          ta="center"
          bg="white"
          style={{
            border: "1px solid var(--mantine-color-gray-2)",
            borderRadius: "var(--mantine-radius-md)",
          }}
        >
          <Text size="sm" c="dimmed" mb="md">
            Sign in with your Rice Google account to apply.
          </Text>
          <Group justify="center">
            <SignInForApplyBtn />
          </Group>
        </Box>
      </Box>
    );
  }

  if (alreadyApplied) {
    return (
      <Box>
        {header}
        <Alert color="blue" radius="md">
          <Text fw={500} mb={4}>
            You&apos;ve already applied to this opening.
          </Text>
          <Text size="sm">
            Track your status on your{" "}
            <a
              href="/protected/applications"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              applications page
            </a>
            .
          </Text>
        </Alert>
      </Box>
    );
  }

  if (userEmail && !userEmail.endsWith("@rice.edu")) {
    return (
      <Box>
        {header}
        <Alert color="yellow" radius="md">
          <Text size="sm">
            A Rice University email address (<strong>@rice.edu</strong>) is
            required to apply. You are signed in as <strong>{userEmail}</strong>
            .
          </Text>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {header}

      {parsedQuestions.length === 0 ? (
        <Box
          p="xl"
          ta="center"
          bg="white"
          style={{
            border: "1px solid var(--mantine-color-gray-2)",
            borderRadius: "var(--mantine-radius-md)",
          }}
        >
          <Text size="sm" c="dimmed">
            No questions have been added to this form yet.
          </Text>
        </Box>
      ) : (
        <Box
          component="form"
          onSubmit={handleSubmit}
          p="xl"
          bg="white"
          style={{
            border: "1px solid var(--mantine-color-gray-2)",
            borderRadius: "var(--mantine-radius-md)",
          }}
        >
          <Stack gap="lg">
            {parsedQuestions.map((q) => (
              <Box key={q.id}>
                <Text size="sm" fw={500} mb="xs">
                  {q.label}
                  {q.is_required && (
                    <Text span c="red" ml={2}>
                      *
                    </Text>
                  )}
                </Text>
                <FormField
                  question={q}
                  value={
                    formState[q.label] ?? (q.type === "checkbox" ? [] : "")
                  }
                  onChange={(v) =>
                    setFormState((prev) => ({ ...prev, [q.label]: v }))
                  }
                />
              </Box>
            ))}

            {error && <Alert color="red">{error}</Alert>}

            <Button type="submit" loading={submitting} fullWidth>
              Submit Application
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
