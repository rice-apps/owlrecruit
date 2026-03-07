"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

interface OrgReviewer {
    id: string;
    user_id: string;
    name: string | null;
    email: string | null;
}

interface EditReviewersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    openingId: string;
    /** user_ids of reviewers currently assigned to this opening */
    currentReviewerUserIds: string[];
    /** Called after save so the parent can refresh its list */
    onSaved?: () => void;
}

// Deterministic avatar background colours based on user id hash
const AVATAR_COLORS = [
    "bg-violet-100 text-violet-700",
    "bg-sky-100 text-sky-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-teal-100 text-teal-700",
    "bg-fuchsia-100 text-fuchsia-700",
    "bg-indigo-100 text-indigo-700",
];

function colorForId(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash << 5) - hash + id.charCodeAt(i);
        hash |= 0;
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string | null | undefined) {
    if (!name) return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
}

export function EditReviewersDialog({
    open,
    onOpenChange,
    orgId,
    openingId,
    currentReviewerUserIds,
    onSaved,
}: EditReviewersDialogProps) {
    const [allReviewers, setAllReviewers] = useState<OrgReviewer[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
        new Set(),
    );
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch all org members with role=reviewer (eligible reviewers)
    const fetchEligibleReviewers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/org/${orgId}/members?role=reviewer`,
                { cache: "no-store" },
            );
            if (!res.ok) throw new Error("Failed to fetch reviewers");
            const data = await res.json();
            // Normalise the shape: the API returns users as a nested object or array
            const reviewers: OrgReviewer[] = data.map(
                (m: {
                    id: string;
                    user_id: string;
                    users:
                    | { name: string | null; email: string | null }
                    | { name: string | null; email: string | null }[]
                    | null;
                }) => {
                    const u = Array.isArray(m.users) ? m.users[0] : m.users;
                    return {
                        id: m.id,
                        user_id: m.user_id,
                        name: u?.name ?? null,
                        email: u?.email ?? null,
                    };
                },
            );
            setAllReviewers(reviewers);
        } catch (err) {
            console.error("Failed to load eligible reviewers:", err);
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    // When the dialog opens, load available reviewers and seed selection
    useEffect(() => {
        if (open) {
            fetchEligibleReviewers();
            setSelectedUserIds(new Set(currentReviewerUserIds));
        }
    }, [open, fetchEligibleReviewers, currentReviewerUserIds]);

    const toggleMember = (userId: string) => {
        setSelectedUserIds((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) {
                next.delete(userId);
            } else {
                next.add(userId);
            }
            return next;
        });
    };

    const hasChanges = useMemo(() => {
        const currentSet = new Set(currentReviewerUserIds);
        if (currentSet.size !== selectedUserIds.size) return true;
        for (const id of selectedUserIds) {
            if (!currentSet.has(id)) return true;
        }
        return false;
    }, [selectedUserIds, currentReviewerUserIds]);

    const handleSave = async () => {
        if (!hasChanges) {
            onOpenChange(false);
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(
                `/api/org/${orgId}/openings/${openingId}/reviewers`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reviewer_user_ids: [...selectedUserIds] }),
                },
            );
            if (!res.ok) throw new Error("Failed to save reviewer assignments");
            onSaved?.();
            onOpenChange(false);
        } catch (err) {
            console.error("Failed to save reviewer assignments:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold uppercase tracking-wide">
                        Assign Reviewers
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Select reviewers to assign to this opening.
                    </DialogDescription>
                </DialogHeader>

                {/* Grid of reviewers */}
                <div className="flex-1 overflow-y-auto py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : allReviewers.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-12">
                            No reviewers in this organization. Add members with the reviewer
                            role first.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {allReviewers.map((reviewer) => {
                                const displayName =
                                    reviewer.name || reviewer.email || "Unknown";
                                const isSelected = selectedUserIds.has(reviewer.user_id);

                                return (
                                    <button
                                        key={reviewer.id}
                                        type="button"
                                        onClick={() => toggleMember(reviewer.user_id)}
                                        className={cn(
                                            "relative flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200",
                                            "hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-owl-purple/40",
                                            isSelected
                                                ? "border-indigo-400 bg-indigo-50/60 shadow-sm border-dashed"
                                                : "border-gray-200 bg-white hover:border-gray-300",
                                        )}
                                    >
                                        {/* Selection indicator */}
                                        {isSelected && (
                                            <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white">
                                                <Check className="h-3 w-3" />
                                            </span>
                                        )}

                                        {/* Avatar */}
                                        <Avatar className="h-10 w-10 shrink-0">
                                            <AvatarFallback
                                                className={cn(
                                                    "text-sm font-semibold",
                                                    colorForId(reviewer.user_id),
                                                )}
                                            >
                                                {initials(displayName)}
                                            </AvatarFallback>
                                        </Avatar>

                                        {/* Name */}
                                        <span className="text-sm font-medium text-gray-900 truncate">
                                            {displayName}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className="bg-owl-purple hover:bg-owl-purple/90 text-white"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving…
                            </>
                        ) : (
                            "Save changes"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
