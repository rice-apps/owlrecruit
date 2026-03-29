"use client";

import { useState, useCallback, useEffect } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { parseQuestionText } from "@/lib/question-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
// Google sign-in button (re-fresh page after sign-in)
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
  const baseClass =
    "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-owl-purple/40";

  switch (question.type) {
    case "textarea":
      return (
        <textarea
          className={`${baseClass} min-h-[100px] resize-y`}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          required={question.is_required ?? false}
        />
      );
    case "select":
      return (
        <select
          className={baseClass}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          required={question.is_required ?? false}
        >
          <option value="">Select an option…</option>
          {(question.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case "checkbox":
      return (
        <div className="space-y-1.5">
          {(question.options ?? []).map((opt) => {
            const checked = Array.isArray(value) && value.includes(opt);
            return (
              <label
                key={opt}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const arr = Array.isArray(value) ? [...value] : [];
                    onChange(
                      checked ? arr.filter((v) => v !== opt) : [...arr, opt],
                    );
                  }}
                  className="w-4 h-4"
                />
                {opt}
              </label>
            );
          })}
        </div>
      );
    case "url":
      return (
        <Input
          type="url"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          required={question.is_required ?? false}
          placeholder="https://"
        />
      );
    default:
      return (
        <Input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
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

  // Header shared between states
  const header = (
    <div className="mb-8">
      <p className="text-sm text-gray-500 mb-1">{orgName}</p>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {description && (
        <p className="text-gray-600 mt-2 text-sm leading-relaxed">
          {description}
        </p>
      )}
      {closesAt && (
        <p className="text-xs text-gray-400 mt-2">
          Closes {new Date(closesAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );

  if (submitted) {
    return (
      <div>
        {header}
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center space-y-2">
          <p className="text-lg font-semibold text-green-800">
            Application submitted!
          </p>
          <p className="text-sm text-green-700">
            You can track your application status on your{" "}
            <a
              href="/protected/applications"
              className="underline hover:text-green-900"
            >
              applications page
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div>
        {header}
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center space-y-4">
          <p className="text-sm text-gray-600">
            Sign in with your Rice Google account to apply.
          </p>
          <div className="flex justify-center">
            <SignInForApplyBtn />
          </div>
        </div>
      </div>
    );
  }

  // Not a rice.edu email
  if (userEmail && !userEmail.endsWith("@rice.edu")) {
    return (
      <div>
        {header}
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-8 text-center space-y-2">
          <p className="text-sm text-yellow-800">
            A Rice University email address (<strong>@rice.edu</strong>) is
            required to apply. You are signed in as <strong>{userEmail}</strong>
            .
          </p>
        </div>
      </div>
    );
  }

  // Already submitted
  if (alreadyApplied) {
    return (
      <div>
        {header}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-8 text-center space-y-2">
          <p className="text-sm text-blue-800 font-medium">
            You&apos;ve already applied to this opening.
          </p>
          <p className="text-sm text-blue-700">
            Track your status on your{" "}
            <a
              href="/protected/applications"
              className="underline hover:text-blue-900"
            >
              applications page
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {header}

      {parsedQuestions.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No questions have been added to this form yet.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white rounded-xl border border-gray-200 p-6"
        >
          {parsedQuestions.map((q) => (
            <div key={q.id} className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-800">
                {q.label}
                {q.is_required && (
                  <span className="text-red-500 ml-0.5">*</span>
                )}
              </label>
              <FormField
                question={q}
                value={formState[q.label] ?? (q.type === "checkbox" ? [] : "")}
                onChange={(v) =>
                  setFormState((prev) => ({ ...prev, [q.label]: v }))
                }
              />
            </div>
          ))}

          {error && (
            <p className="text-sm text-red-600 rounded-lg bg-red-50 px-4 py-3">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Submitting…" : "Submit Application"}
          </Button>
        </form>
      )}
    </div>
  );
}
