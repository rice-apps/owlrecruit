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

  const isEditing = !!opening;

  const [formData, setFormData] = React.useState({
    title: opening?.title || "",
    description: opening?.description || "",
    application_link: opening?.application_link || "",
    closes_at: opening?.closes_at?.split("T")[0] || "",
    status: opening?.status || "draft",
  });

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isEditing ? "Edit Opening" : "Create New Opening"}
            </DialogTitle>
            <button
              onClick={handleClose}
              className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-gray-500">{orgName}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Position Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Position Title <span className="text-red-500">*</span>
              <span className="text-gray-400 text-xs ml-1">(required)</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g. Software Developer"
              required
            />
          </div>

          {/* Application Link */}
          <div className="space-y-2">
            <Label htmlFor="application_link">
              Application Link
              <span className="text-gray-400 text-xs ml-1">(optional)</span>
            </Label>
            <Input
              id="application_link"
              type="url"
              value={formData.application_link}
              onChange={(e) =>
                setFormData({ ...formData, application_link: e.target.value })
              }
              placeholder="https://forms.google.com/..."
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the position and responsibilities..."
              rows={3}
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="closes_at">Due Date</Label>
            <Input
              id="closes_at"
              type="date"
              value={formData.closes_at}
              onChange={(e) =>
                setFormData({ ...formData, closes_at: e.target.value })
              }
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-2">
              {(["draft", "open", "closed"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({ ...formData, status })}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    formData.status === status
                      ? status === "open"
                        ? "bg-cyan-100 text-cyan-700 border border-cyan-300"
                        : status === "draft"
                          ? "bg-gray-100 text-gray-700 border border-gray-300"
                          : "bg-gray-200 text-gray-600 border border-gray-400"
                      : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full bg-cyan-500 hover:bg-cyan-600"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create opening"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
