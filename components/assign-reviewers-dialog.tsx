"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check } from "@untitled-ui/icons-react";

type OrgMember = {
  id: string;
  user_id: string;
  role: "admin" | "reviewer";
  users: {
    id: string;
    name: string | null;
    email: string;
  };
};

interface AssignReviewersDialogProps {
  orgId: string;
  openingId: string;
  currentReviewerIds: string[];
  onSaved: () => void;
  trigger: ReactNode;
}

export function AssignReviewersDialog({
  orgId,
  openingId,
  currentReviewerIds,
  onSaved,
  trigger,
}: AssignReviewersDialogProps) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/org/${orgId}/members`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch members");
      const data: OrgMember[] = await res.json();
      setMembers(data);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (open) {
      fetchMembers();
      setSelected(new Set(currentReviewerIds));
    }
  }, [open, fetchMembers, currentReviewerIds]);

  const toggle = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/org/${orgId}/openings/${openingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewer_ids: Array.from(selected) }),
      });
      if (!res.ok) throw new Error("Failed to save reviewers");
      setOpen(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Reviewers</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading members...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No members in this organization.
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {members.map((member) => {
                const displayName =
                  member.users?.name?.trim() || member.users?.email || "Unknown";
                const isSelected = selected.has(member.user_id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggle(member.user_id)}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? "border-owl-purple bg-owl-purple/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.users?.email}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-owl-purple shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
