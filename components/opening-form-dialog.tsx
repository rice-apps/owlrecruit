"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface OpeningFormDialogProps {
  orgId: string;
  orgName: string;
  opening?: {
    id: string;
    title: string;
    description: string | null;
    application_link: string | null;
    closes_at: string | null;
    status: "draft" | "open" | "closed";
  };
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function OpeningFormDialog({
  orgId,
  orgName,
  opening,
  trigger,
  onSuccess,
}: OpeningFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  console.log("OpeningFormDialog opening:", opening);

  const isEditing = !!opening;

  // keep closes_at in a `datetime-local`-compatible string (YYYY-MM-DDTHH:MM)
  const toLocalDatetime = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    // create a locale-equivalent ISO without the timezone Z so it works with datetime-local
    const tzOffset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - tzOffset);
    return local.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = React.useState({
    title: opening?.title || "",
    description: opening?.description || "",
    application_link: opening?.application_link || "",
    closes_at: toLocalDatetime(opening?.closes_at || null),
    status: opening?.status || "draft",
  });

  const [editingDue, setEditingDue] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError("Position title is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const payload = {
        org_id: orgId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        application_link: formData.application_link.trim() || null,
        closes_at: formData.closes_at
          ? new Date(formData.closes_at).toISOString()
          : null,
        status: formData.status,
      };

      if (isEditing && opening) {
        // Update existing opening
        const { error: updateError } = await supabase
          .from("openings")
          .update(payload)
          .eq("id", opening.id);

        if (updateError) throw updateError;
      } else {
        // Create new opening
        const { error: insertError } = await supabase
          .from("openings")
          .insert(payload);

        if (insertError) throw insertError;
      }

      setOpen(false);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      console.error("Error saving opening:", err);
      setError(err instanceof Error ? err.message : "Failed to save opening");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    if (!isEditing) {
      setFormData({
        title: "",
        description: "",
        application_link: "",
        closes_at: "",
        status: "draft",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create new opening
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1 pb-6">
          <DialogTitle className="text-2xl font-semibold">
            {isEditing ? "Edit Opening" : "Create New Opening"}
          </DialogTitle>
          <p className="text-sm text-gray-500">{orgName}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Position Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-medium">
              Position Title <span className="text-red-500">*</span>
              <span className="text-gray-500 font-normal"> (required)</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g. Software Developer"
              required
              className="h-12 text-base"
            />
          </div>

          {/* Application Link */}
          <div className="space-y-2">
            <Label htmlFor="application_link" className="text-base font-medium">
              Application Link <span className="text-red-500">*</span>
              <span className="text-gray-500 font-normal"> (required)</span>
            </Label>
            <Input
              id="application_link"
              type="url"
              value={formData.application_link}
              onChange={(e) =>
                setFormData({ ...formData, application_link: e.target.value })
              }
              placeholder="https://forms.google.com/..."
              className="h-12 text-base"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the position and responsibilities..."
              rows={1}
              className="text-base resize-y min-h-[48px]"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Due Date</Label>

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
                    const time = formData.closes_at ? formData.closes_at.slice(11, 16) : "23:59";
                    setFormData({ ...formData, closes_at: date ? `${date}T${time}` : "" });
                  }}
                  className="h-10 text-base w-auto"
                />
                <Input
                  id="closes_time"
                  type="time"
                  value={formData.closes_at ? formData.closes_at.slice(11, 16) : "23:59"}
                  onChange={(e) => {
                    const time = e.target.value;
                    const date = formData.closes_at ? formData.closes_at.slice(0, 10) : new Date().toISOString().slice(0, 10);
                    setFormData({ ...formData, closes_at: date ? `${date}T${time}` : "" });
                  }}
                  className="h-10 text-base w-auto"
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

          {/* Applicant Stages Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium uppercase text-gray-700 tracking-wide">
              Applicant Stages
            </Label>
            <div className="flex flex-wrap gap-2">
              {["Accepted", "Interview", "Rejected"].map((stage) => (
                <button
                  key={stage}
                  type="button"
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    stage === "Accepted"
                      ? "bg-cyan-500 text-white shadow-md"
                      : stage === "Interview"
                        ? "bg-cyan-100 text-cyan-700 border border-cyan-300"
                        : "bg-black text-white shadow-md"
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>

           {/* Assign Reviewers Section **NOT IMPLEMENTED YET** */}
          <div className="space-y-3">
            <Label className="text-base font-medium uppercase text-gray-700 tracking-wide">
              Assign Reviewers
            </Label>
            <p className="text-sm text-gray-500">No reviewers assigned</p>
          </div>

          {/* Opening Status Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium uppercase text-gray-700 tracking-wide">
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

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full h-14 text-base bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-xl"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Save changes"
                : "Create opening"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
