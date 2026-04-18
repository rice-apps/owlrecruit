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
import { Pencil01, X, Upload01 } from "@untitled-ui/icons-react";

type EditOrgDialogProps = {
  orgId: string;
  orgName: string;
  orgDescription: string | null;
  orgLogoUrl?: string | null;
  triggerClassName?: string;
};

export function EditOrgDialog({
  orgId,
  orgName,
  orgDescription,
  orgLogoUrl,
  triggerClassName,
}: EditOrgDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(orgName);
  const [description, setDescription] = React.useState(orgDescription ?? "");
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  // Reset form to current values whenever the dialog opens
  React.useEffect(() => {
    if (open) {
      setName(orgName);
      setDescription(orgDescription ?? "");
      setLogoFile(null);
      setLogoPreview(null);
      setError(null);
    }
  }, [open, orgName, orgDescription]);

  const handleLogoChange = (file: File | null) => {
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0] ?? null;
    handleLogoChange(file);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Organization name is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim() || "");
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const res = await fetch(`/api/org/${orgId}`, {
        method: "PATCH",
        body: formData,
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
            <Label className="text-sm font-medium text-gray-700">
              Logo
            </Label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
            />
            <div
              onDrop={handleLogoDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => logoInputRef.current?.click()}
              className="relative flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 transition hover:bg-slate-100 cursor-pointer"
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : orgLogoUrl ? (
                <img
                  src={orgLogoUrl}
                  alt="Current logo"
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload01 className="h-6 w-6 text-slate-400" />
                  <span className="text-sm text-slate-500">
                    Drag and drop or click to upload
                  </span>
                </div>
              )}
            </div>
            {logoFile && (
              <button
                type="button"
                onClick={() => {
                  setLogoFile(null);
                  setLogoPreview(null);
                  if (logoInputRef.current) {
                    logoInputRef.current.value = "";
                  }
                }}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Remove logo
              </button>
            )}
          </div>

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
