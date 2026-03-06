"use client";

import { useState } from "react";
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
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(
    initialData.description || "",
  );
  const [applicationLink, setApplicationLink] = useState(
    initialData.application_link || "",
  );
  const [closesAt, setClosesAt] = useState(initialData.closes_at || "");
  const [status, setStatus] = useState(initialData.status);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/org/${orgId}/openings/${openingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          application_link: applicationLink,
          closes_at: closesAt || null,
          status,
        }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
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
            <Label htmlFor="edit-link">Application Link</Label>
            <Input
              id="edit-link"
              value={applicationLink}
              onChange={(e) => setApplicationLink(e.target.value)}
              placeholder="https://..."
            />
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
