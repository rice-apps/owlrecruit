"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit01, X } from "@untitled-ui/icons-react";
import { type SocialLinks, PLATFORMS } from "@/components/org/social-links";

type EditSocialLinksDialogProps = {
  orgId: string;
  initialLinks: SocialLinks;
};

export function EditSocialLinksDialog({
  orgId,
  initialLinks,
}: EditSocialLinksDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<SocialLinks>(initialLinks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/org/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ social_links: links }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      router.refresh();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Edit social links"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <Edit01 className="h-[18px] w-[18px]" />
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-sm p-6 flex flex-col gap-5"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold">
              Social links
            </DialogTitle>
            <DialogClose className="opacity-70 transition-opacity hover:opacity-100 rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {PLATFORMS.map(({ key, label, Icon }) => (
            <div key={key} className="flex items-center gap-3">
              <Icon className="h-[18px] w-[18px] shrink-0 text-slate-400" />
              <Input
                placeholder={label}
                value={links[key] ?? ""}
                onChange={(e) =>
                  setLinks((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="h-9 text-sm"
              />
            </div>
          ))}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="ghost" size="sm" disabled={saving}>
              Cancel
            </Button>
          </DialogClose>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
