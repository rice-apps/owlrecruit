"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil01, X } from "@untitled-ui/icons-react";

type EditOrgDialogProps = {
  orgId: string;
  orgName: string;
  orgDescription: string | null;
  triggerClassName?: string;
};

export function EditOrgDialog({
  orgId,
  orgName,
  orgDescription,
  triggerClassName,
}: EditOrgDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(orgName);
  const [description, setDescription] = React.useState(orgDescription ?? "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset form to current values whenever the dialog opens
  React.useEffect(() => {
    if (open) {
      setName(orgName);
      setDescription(orgDescription ?? "");
      setError(null);
    }
  }, [open, orgName, orgDescription]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Organization name is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/org/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save changes");
      }

      router.refresh();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Edit organization"
          className={triggerClassName}
        >
          <Pencil01 className="h-[22px] w-[22px]" />
          <span className="sr-only">Edit organization</span>
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md p-6 flex flex-col gap-6"
      >
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <DialogClose className="opacity-70 transition-opacity hover:opacity-100 rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
          <DialogTitle className="text-xl font-semibold">
            Edit organization
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="edit-org-name" className="text-sm font-medium text-gray-700">
              Organization Name<span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-org-description" className="text-sm font-medium text-gray-700">
              Description
            </Label>
            <Input
              id="edit-org-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11 text-sm"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
              {error}
            </p>
          )}
        </div>

        <div className="border-t pt-4 flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="outline" disabled={isSaving} className="px-6">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving} className="px-6">
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
