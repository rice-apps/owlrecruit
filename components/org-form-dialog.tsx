"use client";

import * as React from "react";

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
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface OrgFormDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: (orgId: string) => void;
}

export function OrgFormDialog({ trigger, onSuccess }: OrgFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Organization name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("You must be logged in to create an organization");
      }

      // Create the organization
      const { data: newOrg, error: insertError } = await supabase
        .from("orgs")
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      // Add the creator as an admin of the organization
      const { error: memberError } = await supabase.from("org_members").insert({
        user_id: user.id,
        org_id: newOrg.id,
        role: "admin",
      });

      if (memberError) throw memberError;

      // Reset form and close
      setFormData({ name: "", description: "" });
      setOpen(false);

      // Callback or redirect
      if (onSuccess) {
        onSuccess(newOrg.id);
      } else {
        // Force a full reload to ensure the sidebar layout updates with the new organization
        window.location.href = `/protected/org/${newOrg.id}`;
      }
    } catch (err) {
      console.error("Error creating organization:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create organization",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setFormData({ name: "", description: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add new organization
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1 pb-6">
          <DialogTitle className="text-2xl font-semibold">
            Create New Organization
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organization Name */}
          <div className="space-y-2">
            <Label htmlFor="org-name" className="text-base font-medium">
              Organization Name <span className="text-red-500">*</span>
              <span className="text-gray-500 font-normal"> (required)</span>
            </Label>
            <Input
              id="org-name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. Rice Apps"
              required
              className="h-12 text-base"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="org-description" className="text-base font-medium">
              Description
            </Label>
            <Textarea
              id="org-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe your organization..."
              rows={1}
              className="text-base resize-y min-h-[48px]"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-12 text-base"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 text-base bg-cyan-500 hover:bg-cyan-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Organization"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
