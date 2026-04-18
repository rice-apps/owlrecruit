"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil01 } from "@untitled-ui/icons-react";

interface EditOpeningDialogProps {
  orgId: string;
  openingId: string;
  initialData: {
    title: string;
    description?: string;
    application_link?: string;
    closes_at?: string;
    status: "draft" | "open" | "closed";
  };
}

export function EditOpeningDialog({
  orgId,
  openingId,
  initialData,
}: EditOpeningDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description || "");
  const [useNativeForm, setUseNativeForm] = useState(
    !initialData.application_link,
  );
  const [applicationLink, setApplicationLink] = useState(
    initialData.application_link || "",
  );
  const [closesAt, setClosesAt] = useState(initialData.closes_at || "");
  const [status, setStatus] = useState(initialData.status);

  // Reset form state whenever the dialog opens so we always show fresh data
  useEffect(() => {
    if (open) {
      setSaveError(null);
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setUseNativeForm(!initialData.application_link);
      setApplicationLink(initialData.application_link || "");
      setClosesAt(initialData.closes_at || "");
      setStatus(initialData.status);
    }
  }, [open, initialData]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/org/${orgId}/openings/${openingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          application_link: useNativeForm ? null : applicationLink || null,
          closes_at: closesAt || null,
          status,
        }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setSaveError(data?.error || "Failed to save changes. Please try again.");
      }
    } catch {
      setSaveError("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil01 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Opening</DialogTitle>
          <DialogDescription className="sr-only">
            Edit the details of this opening.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Application Method</Label>
            <div className="flex rounded-lg border border-gray-200 w-fit overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setUseNativeForm(true);
                  setApplicationLink("");
                }}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  useNativeForm
                    ? "bg-primary text-primary-foreground"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Native Form
              </button>
              <button
                type="button"
                onClick={() => {
                  setUseNativeForm(false);
                  if (!applicationLink) setApplicationLink("https://");
                }}
                className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
                  !useNativeForm
                    ? "bg-primary text-primary-foreground"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Google Forms
              </button>
            </div>
            {!useNativeForm && (
              <Input
                id="edit-link"
                type="url"
                value={applicationLink}
                onChange={(e) => setApplicationLink(e.target.value)}
                placeholder="https://forms.google.com/..."
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-closes">Closes At</Label>
            <Input
              id="edit-closes"
              type="date"
              value={closesAt ? closesAt.split("T")[0] : ""}
              onChange={(e) => setClosesAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-2">
              {(["draft", "open", "closed"] as const).map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant={status === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatus(s)}
                  className="capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
          {saveError && (
            <p className="text-sm text-red-600 rounded-lg bg-red-50 px-4 py-3">
              {saveError}
            </p>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !title.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
