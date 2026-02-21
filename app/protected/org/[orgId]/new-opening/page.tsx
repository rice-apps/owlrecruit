"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ChevronDown, UserPlus, X } from "lucide-react";

interface EligibleReviewer {
  id: string;
  user_id: string;
  role: string;
  users:
    | { id: string; name: string | null; email: string }
    | { id: string; name: string | null; email: string }[]
    | null;
}

export default function NewOpeningPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId;
  const router = useRouter();

  const [orgName, setOrgName] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [eligibleReviewers, setEligibleReviewers] = React.useState<
    EligibleReviewer[]
  >([]);
  const [selectedReviewers, setSelectedReviewers] = React.useState<string[]>(
    [],
  );
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [editingDue, setEditingDue] = React.useState(false);

  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    application_link: "",
    closes_at: "",
    status: "draft" as "draft" | "open" | "closed",
  });

  // Fetch org name and eligible reviewers on mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [orgsRes, reviewersRes] = await Promise.all([
          fetch(`/api/orgs`),
          fetch(`/api/org/${orgId}/members?role=admin,reviewer`),
        ]);
        if (orgsRes.ok) {
          const orgs = await orgsRes.json();
          const org = orgs.find((o: { id: string; name: string }) => o.id === orgId);
          if (org) setOrgName(org.name);
        }
        if (reviewersRes.ok) {
          const reviewerData = await reviewersRes.json();
          setEligibleReviewers(reviewerData);
        }
      } catch (err) {
        console.error("Error fetching page data:", err);
      }
    };
    fetchData();
  }, [orgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError("Position title is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/org/${orgId}/openings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          application_link: formData.application_link.trim() || null,
          closes_at: formData.closes_at
            ? new Date(formData.closes_at).toISOString()
            : null,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create opening");
      }

      router.push(`/protected/org/${orgId}`);
    } catch (err) {
      console.error("Error creating opening:", err);
      setError(err instanceof Error ? err.message : "Failed to create opening");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-12 py-10">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="text-3xl font-semibold mb-1">Create New Opening</h1>
      {orgName && <p className="text-sm text-gray-500 mb-8">{orgName}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 space-y-7">
        {/* Position Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium text-gray-700">
            Position Title <span className="text-red-500">*</span>
            <span className="text-gray-500 font-normal"> (required)</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Software Developer"
            required
            className="h-11 text-sm w-full"
          />
        </div>

        {/* Application Link */}
        <div className="space-y-2">
          <Label htmlFor="application_link" className="text-sm font-medium text-gray-700">
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
            className="h-11 text-sm w-full"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
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
            className="text-sm resize-y min-h-[80px] w-full"
          />
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Due Date</Label>
          {!editingDue ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => setEditingDue(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setEditingDue(true);
              }}
              className="flex items-center gap-2 text-gray-400 cursor-pointer"
            >
              <span className="underline decoration-gray-200">
                {formData.closes_at
                  ? new Date(formData.closes_at).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })
                  : "Select date"}
              </span>
              <span className="underline decoration-gray-200">
                {formData.closes_at
                  ? new Date(formData.closes_at).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "Select time"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-auto">
              <Input
                id="closes_date"
                type="date"
                value={formData.closes_at ? formData.closes_at.slice(0, 10) : ""}
                onChange={(e) => {
                  const date = e.target.value;
                  const time = formData.closes_at
                    ? formData.closes_at.slice(11, 16)
                    : "23:59";
                  setFormData({
                    ...formData,
                    closes_at: date ? `${date}T${time}` : "",
                  });
                }}
                className="h-10 text-sm w-auto"
              />
              <Input
                id="closes_time"
                type="time"
                value={
                  formData.closes_at
                    ? formData.closes_at.slice(11, 16)
                    : "23:59"
                }
                onChange={(e) => {
                  const time = e.target.value;
                  const date = formData.closes_at
                    ? formData.closes_at.slice(0, 10)
                    : new Date().toISOString().slice(0, 10);
                  setFormData({
                    ...formData,
                    closes_at: date ? `${date}T${time}` : "",
                  });
                }}
                className="h-10 text-sm w-auto"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditingDue(false)}
              >
                Done
              </Button>
            </div>
          )}
        </div>

        {/* Applicant Stages */}
        <div className="space-y-3">
          <Label className="text-sm font-medium uppercase text-gray-700 tracking-wide">
            Applicant Stages
          </Label>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "Accepted", className: "bg-green-500 text-white" },
              { label: "Rejected", className: "bg-red-400 text-white" },
              { label: "Pending", className: "bg-white text-gray-700 border border-gray-300" },
              { label: "Interview", className: "bg-gray-700 text-white" },
            ].map(({ label, className }) => (
              <span
                key={label}
                className={`px-4 py-1.5 rounded-full text-sm font-medium ${className}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Assign Reviewers */}
        <div className="space-y-3">
          <Label className="text-sm font-medium uppercase text-gray-700 tracking-wide">
            Assign Reviewers
          </Label>
          <div className="flex flex-wrap gap-2">
            {selectedReviewers.length > 0 ? (
              selectedReviewers.map((userId) => {
                const reviewer = eligibleReviewers.find(
                  (r) => r.user_id === userId,
                );
                if (!reviewer) return null;
                return (
                  <button
                    key={userId}
                    type="button"
                    onClick={() =>
                      setSelectedReviewers(
                        selectedReviewers.filter((id) => id !== userId),
                      )
                    }
                    className="flex items-center gap-2 pl-4 pr-3 py-2 bg-white text-gray-900 rounded-full border-2 border-gray-200 hover:border-gray-300 transition-all shadow-sm hover:shadow"
                  >
                    <span className="font-medium text-sm">
                      {Array.isArray(reviewer.users)
                        ? reviewer.users[0]?.name || reviewer.users[0]?.email
                        : reviewer.users?.name || reviewer.users?.email}
                    </span>
                    <X className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 py-2">No reviewers assigned</p>
            )}
          </div>

          {eligibleReviewers.length > 0 && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between gap-2"
                onClick={(e) => {
                  e.preventDefault();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Reviewer
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
              <div
                className={`${isDropdownOpen ? "" : "hidden"} border rounded-lg max-h-48 overflow-y-auto`}
              >
                {eligibleReviewers.map((reviewer) => {
                  const isSelected = selectedReviewers.includes(
                    reviewer.user_id,
                  );
                  return (
                    <button
                      key={reviewer.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedReviewers(
                            selectedReviewers.filter(
                              (id) => id !== reviewer.user_id,
                            ),
                          );
                        } else {
                          setSelectedReviewers([
                            ...selectedReviewers,
                            reviewer.user_id,
                          ]);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors ${
                        isSelected ? "bg-cyan-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded"
                        />
                        <div className="text-left">
                          <p className="font-medium text-sm">
                            {Array.isArray(reviewer.users)
                              ? reviewer.users[0]?.name || "Unknown User"
                              : reviewer.users?.name || "Unknown User"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {Array.isArray(reviewer.users)
                              ? reviewer.users[0]?.email
                              : reviewer.users?.email}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 uppercase">
                        {reviewer.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Opening Status */}
        <div className="space-y-3">
          <Label className="text-sm font-medium uppercase text-gray-700 tracking-wide">
            Opening Status
          </Label>
          <div className="flex flex-wrap gap-2">
            {(["draft", "open", "closed"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFormData({ ...formData, status })}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  formData.status === status
                    ? status === "open"
                      ? "bg-cyan-500 text-white shadow-md"
                      : status === "draft"
                        ? "bg-cyan-100 text-cyan-700 border border-cyan-300"
                        : "bg-black text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Add Rubric */}
        <div>
          <button
            type="button"
            className="text-sm font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
          >
            Add rubric +
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {/* Actions — bottom right */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="px-8 h-11 text-sm"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="px-8 h-11 text-sm bg-indigo-500 hover:bg-indigo-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create opening"}
          </Button>
        </div>
      </form>
    </div>
  );
}
