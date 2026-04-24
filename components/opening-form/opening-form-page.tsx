"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@untitled-ui/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DueDateInput } from "@/components/opening-form/due-date-input";
import { ReviewerSelector } from "@/components/opening-form/reviewer-selector";
import { RubricEditor } from "@/components/opening-form/rubric-editor";
import type {
  OpeningFormData,
  OpeningInitialData,
  RubricItem,
} from "@/components/opening-form/types";
import { useOpeningFormContext } from "@/components/opening-form/use-opening-form-context";

interface OpeningFormPageProps {
  mode: "create" | "edit";
  orgId: string;
  openingId?: string;
  initialOpening?: OpeningInitialData;
}

function toLocalDateTimeValue(value?: string | null): string {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

function initialRubric(initialOpening?: OpeningInitialData): RubricItem[] {
  return (initialOpening?.rubric || []).map((item) => ({
    name: item.name || "",
    max_val: Number(item.max_val) || 10,
    description: item.description || "",
  }));
}

export function OpeningFormPage({
  mode,
  orgId,
  openingId,
  initialOpening,
}: OpeningFormPageProps) {
  const router = useRouter();
  const { orgName, eligibleReviewers } = useOpeningFormContext(orgId);
  const isEditMode = mode === "edit";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [rubric, setRubric] = useState<RubricItem[]>(
    initialRubric(initialOpening),
  );
  const [formData, setFormData] = useState<OpeningFormData>({
    title: initialOpening?.title || "",
    description: initialOpening?.description || "",
    application_link: initialOpening?.application_link || "",
    closes_at: toLocalDateTimeValue(initialOpening?.closes_at),
    status: initialOpening?.status === "closed" ? "closed" : "open",
  });

  const pageTitle = isEditMode ? "Edit Opening" : "Create New Opening";

  const normalizedRubric = rubric
    .filter((item) => item.name.trim())
    .map((item) => ({
      name: item.name.trim(),
      max_val: Number(item.max_val) || 0,
      description: item.description?.trim() || "",
    }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError("Position title is required");
      return;
    }

    if (isEditMode && !openingId) {
      setError("Opening ID is required for editing");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        application_link: formData.application_link.trim() || null,
        closes_at: formData.closes_at
          ? new Date(formData.closes_at).toISOString()
          : null,
        status: formData.status,
        rubric: isEditMode
          ? normalizedRubric
          : normalizedRubric.length > 0
            ? normalizedRubric
            : undefined,
      };

      if (!isEditMode) {
        payload.org_id = orgId;
      }

      const endpoint = isEditMode
        ? `/api/org/${orgId}/openings/${openingId}`
        : `/api/org/${orgId}/openings`;

      const response = await fetch(endpoint, {
        method: isEditMode ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(
          data.error || `Failed to ${isEditMode ? "update" : "create"} opening`,
        );
      }

      if (isEditMode && openingId) {
        router.push(`/protected/org/${orgId}/opening/${openingId}`);
      } else {
        router.push(`/protected/org/${orgId}`);
      }
    } catch (submitError) {
      console.error("Error submitting opening:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : `Failed to ${isEditMode ? "update" : "create"} opening`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <button
        onClick={() => router.back()}
        className="mb-8 flex w-fit items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="mb-1 text-3xl font-semibold">{pageTitle}</h1>
      {orgName && <p className="mb-8 text-sm text-gray-500">{orgName}</p>}

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col space-y-7">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium text-gray-700">
            Position Title <span className="text-red-500">*</span>
            <span className="font-normal text-gray-500"> (required)</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="e.g. Software Developer"
            required
            className="h-11 w-full text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="application_link"
            className="text-sm font-medium text-gray-700"
          >
            Application Link
          </Label>
          <Input
            id="application_link"
            type="url"
            value={formData.application_link}
            onChange={(e) =>
              setFormData({ ...formData, application_link: e.target.value })
            }
            placeholder="https://forms.google.com/..."
            className="h-11 w-full text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="description"
            className="text-sm font-medium text-gray-700"
          >
            Description
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe the position and responsibilities..."
            rows={3}
            className="min-h-[80px] w-full resize-y text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Due Date</Label>
          <DueDateInput
            value={formData.closes_at}
            onChange={(value) => setFormData({ ...formData, closes_at: value })}
          />
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium uppercase tracking-wide text-gray-700">
            Applicant Stages
          </Label>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "Accepted", className: "bg-owl-green text-white" },
              { label: "Rejected", className: "bg-owl-red text-white" },
              {
                label: "Pending",
                className: "border border-[#C5C5C5] bg-white text-gray-600",
              },
              { label: "Interview", className: "bg-gray-500 text-white" },
            ].map(({ label, className }) => (
              <span
                key={label}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${className}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <ReviewerSelector
          eligibleReviewers={eligibleReviewers}
          selectedReviewers={selectedReviewers}
          onChange={setSelectedReviewers}
        />

        <div className="space-y-3">
          <Label className="text-sm font-medium uppercase tracking-wide text-gray-700">
            Opening Status
          </Label>
          <div className="flex flex-wrap gap-2">
            {(["open", "closed"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFormData({ ...formData, status })}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                  formData.status === status
                    ? status === "open"
                      ? "bg-owl-purple text-white shadow-md"
                      : "bg-black text-white shadow-md"
                    : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <RubricEditor rubric={rubric} onChange={setRubric} />

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="h-11 px-8 text-sm"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-11 px-8 text-sm"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isEditMode
                ? "Saving..."
                : "Creating..."
              : isEditMode
                ? "Save changes"
                : "Create opening"}
          </Button>
        </div>
      </form>
    </div>
  );
}
