"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users01, X } from "@untitled-ui/icons-react";

type Member = {
  id: string; // org_members.id
  role: "admin" | "reviewer";
  user_id: string;
  users: {
    id: string;
    name: string;
    email: string;
  };
};

type SearchedUser = {
  id: string;
  name: string;
  email: string;
};

export function EditMembersDialog({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [members, setMembers] = useState<Member[]>([]);
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Pending changes tracking
  const [pendingAdds, setPendingAdds] = useState<
    Map<string, { user: SearchedUser; role: "admin" | "reviewer" }>
  >(new Map());
  const [pendingRoleChanges, setPendingRoleChanges] = useState<
    Map<string, "admin" | "reviewer">
  >(new Map());
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(
    new Set(),
  );

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const hasPendingChanges =
    pendingAdds.size > 0 ||
    pendingRoleChanges.size > 0 ||
    pendingRemovals.size > 0;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/org/${orgId}/members`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch members");
      const data = await res.json();
      setMembers(data as unknown as Member[]);
    } catch (error) {
      logger.error("Failed to fetch members:", error);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  // Initial load — reset all state when dialog opens
  useEffect(() => {
    if (open) {
      fetchMembers();
      setSearchQuery("");
      setDebouncedSearch("");
      setSearchResults([]);
      setPendingAdds(new Map());
      setPendingRoleChanges(new Map());
      setPendingRemovals(new Set());
    }
  }, [open, fetchMembers]);

  // Search logic
  useEffect(() => {
    if (debouncedSearch) {
      const search = async () => {
        try {
          setIsSearching(true);
          const res = await fetch(
            `/api/org/${orgId}/members/search?q=${encodeURIComponent(debouncedSearch)}`,
            { cache: "no-store" },
          );
          if (!res.ok) throw new Error("Failed to search users");
          const results = await res.json();
          setSearchResults(results as SearchedUser[]);
        } catch (error) {
          logger.error("Failed to search users:", error);
        } finally {
          setIsSearching(false);
        }
      };
      search();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch, orgId]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Ignore clicks inside the search container
      if (searchContainerRef.current?.contains(target)) return;
      // Ignore clicks inside portaled Radix Select content (rendered at body level)
      if (target.closest("[data-radix-popper-content-wrapper]")) return;
      setSearchQuery("");
    };
    if (searchQuery) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [searchQuery]);

  const handleAddMember = (user: SearchedUser, role: "admin" | "reviewer") => {
    // Add to local members list
    const newMember: Member = {
      id: `pending-${user.id}`,
      role,
      user_id: user.id,
      users: { id: user.id, name: user.name, email: user.email },
    };
    setMembers((prev) => [...prev, newMember]);

    // Track as pending add
    setPendingAdds((prev) => {
      const next = new Map(prev);
      next.set(user.id, { user, role });
      return next;
    });

    // If this user was previously pending removal, remove from removals
    setPendingRemovals((prev) => {
      if (prev.has(user.id)) {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      }
      return prev;
    });

    // Remove from search results
    setSearchResults((prev) => prev.filter((u) => u.id !== user.id));
  };

  const handleUndoRemoval = (userId: string) => {
    setPendingRemovals((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    if (newRole === "Remove") {
      if (pendingAdds.has(userId)) {
        // Was a pending add — just remove it entirely
        setMembers((prev) => prev.filter((m) => m.user_id !== userId));
        setPendingAdds((prev) => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      } else {
        // Existing member — mark for removal but keep in list
        setPendingRemovals((prev) => {
          const next = new Set(prev);
          next.add(userId);
          return next;
        });
        // Clean up any pending role change
        setPendingRoleChanges((prev) => {
          if (prev.has(userId)) {
            const next = new Map(prev);
            next.delete(userId);
            return next;
          }
          return prev;
        });
      }
      return;
    }

    const typedRole = newRole as "admin" | "reviewer";

    // Update local members list
    setMembers((prev) =>
      prev.map((m) => (m.user_id === userId ? { ...m, role: typedRole } : m)),
    );

    if (pendingAdds.has(userId)) {
      // Update the pending add's role
      setPendingAdds((prev) => {
        const next = new Map(prev);
        const existing = next.get(userId)!;
        next.set(userId, { ...existing, role: typedRole });
        return next;
      });
    } else {
      // Existing member — track role change
      setPendingRoleChanges((prev) => {
        const next = new Map(prev);
        next.set(userId, typedRole);
        return next;
      });
    }
  };

  const handleDone = async () => {
    if (!hasPendingChanges) {
      setOpen(false);
      return;
    }

    try {
      setIsSaving(true);

      const promises: Promise<Response>[] = [];

      // Process additions
      for (const [userId, { role }] of pendingAdds) {
        promises.push(
          fetch(`/api/org/${orgId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, role }),
          }),
        );
      }

      // Process role changes
      for (const [userId, role] of pendingRoleChanges) {
        promises.push(
          fetch(`/api/org/${orgId}/members/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role }),
          }),
        );
      }

      // Process removals
      for (const userId of pendingRemovals) {
        promises.push(
          fetch(`/api/org/${orgId}/members/${userId}`, {
            method: "DELETE",
          }),
        );
      }

      await Promise.all(promises);
      router.refresh();
      setOpen(false);
    } catch (error) {
      logger.error("Failed to save changes:", error);
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter search results to exclude users already in the members list
  const filteredSearchResults = searchResults.filter(
    (user) => !members.some((m) => m.user_id === user.id),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Users01 className="w-4 h-4" />
          Edit Members
        </Button>
      </DialogTrigger>
      {/* Set showCloseButton=false so we can place X on the left like the design */}
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md p-6 max-h-[85vh] flex flex-col gap-6"
      >
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <DialogClose className="opacity-70 transition-opacity hover:opacity-100 rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
          <DialogTitle className="sr-only">Edit members</DialogTitle>
          <DialogDescription className="sr-only">
            Add or remove organization members and change their roles.
          </DialogDescription>
          <div className="relative" ref={searchContainerRef}>
            <Input
              placeholder="Add members"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-base font-medium py-6"
            />
            {/* Search results as floating overlay */}
            {searchQuery && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[240px] overflow-y-auto rounded-md border bg-popover p-2 shadow-md">
                {isSearching ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground">
                    Searching...
                  </p>
                ) : filteredSearchResults.length > 0 ? (
                  filteredSearchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-3 rounded-sm px-2 py-2 hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {user.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </div>
                      <Select
                        onValueChange={(val) => {
                          // Defer so the Select can finish closing before we unmount the row
                          setTimeout(
                            () =>
                              handleAddMember(
                                user,
                                val as "admin" | "reviewer",
                              ),
                            0,
                          );
                        }}
                      >
                        <SelectTrigger className="w-[110px] h-8 text-xs">
                          <SelectValue placeholder="Add as..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reviewer">Reviewer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))
                ) : (
                  <p className="px-2 py-3 text-sm text-muted-foreground">
                    No users found.
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Members</h4>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : members.length > 0 ? (
              members.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center justify-between gap-3 rounded-md px-2 py-1 ${
                    pendingRemovals.has(member.user_id)
                      ? "opacity-50"
                      : pendingAdds.has(member.user_id)
                        ? "bg-accent/50"
                        : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                        {member.users.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${pendingRemovals.has(member.user_id) ? "line-through" : ""}`}
                        >
                          {member.users.name || "Unknown"}
                        </span>
                        {pendingAdds.has(member.user_id) && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            New
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {member.users.email}
                      </span>
                    </div>
                  </div>
                  {pendingRemovals.has(member.user_id) ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => handleUndoRemoval(member.user_id)}
                    >
                      Undo
                    </Button>
                  ) : (
                    <Select
                      value={member.role}
                      onValueChange={(val) =>
                        handleRoleChange(member.user_id, val)
                      }
                    >
                      <SelectTrigger className="w-[110px] h-9 capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="reviewer"
                          disabled={
                            member.role === "admin" &&
                            members.filter((m) => m.role === "admin").length ===
                              1
                          }
                        >
                          Reviewer
                        </SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        {!(
                          member.role === "admin" &&
                          members.filter((m) => m.role === "admin").length === 1
                        ) && (
                          <SelectItem
                            value="Remove"
                            className="text-destructive focus:text-destructive"
                          >
                            Remove
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No existing members.
              </p>
            )}
          </div>
        </div>

        {/* Sticky footer with Done button */}
        <div className="border-t pt-4">
          <Button onClick={handleDone} disabled={isSaving} className="w-full">
            {isSaving ? "Saving..." : "Done"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
