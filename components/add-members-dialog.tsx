"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
import { Users, X } from "lucide-react";

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

export function AddMembersDialog({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [members, setMembers] = useState<Member[]>([]);
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

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
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  // Initial load
  useEffect(() => {
    if (open) {
      fetchMembers();
      setSearchQuery("");
      setSearchResults([]);
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
            { cache: "no-store" }
          );
          if (!res.ok) throw new Error("Failed to search users");
          const results = await res.json();
          setSearchResults(results as SearchedUser[]);
        } catch (error) {
          console.error(error);
        } finally {
          setIsSearching(false);
        }
      };
      search();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch, orgId]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      if (newRole === "Remove") {
        setMembers((prev) => prev.filter((m) => m.user_id !== userId));
        const res = await fetch(`/api/org/${orgId}/members/${userId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to remove member");
      } else {
        setMembers((prev) =>
          prev.map((m) =>
            m.user_id === userId
              ? { ...m, role: newRole as "admin" | "reviewer" }
              : m,
          ),
        );
        const res = await fetch(`/api/org/${orgId}/members/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole as "admin" | "reviewer" }),
        });
        if (!res.ok) throw new Error("Failed to update member role");
      }
      // Refresh server component to reflect changes on the page
      router.refresh();
      fetchMembers();
    } catch (error) {
      console.error(error);
      // Revert optimistic update on error
      await fetchMembers();
    }
  };

  const handleAddMember = async (userId: string, role: string) => {
    try {
      const res = await fetch(`/api/org/${orgId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: role as "admin" | "reviewer" }),
      });
      if (!res.ok) throw new Error("Failed to add member");
      // Remove from search results implicitly or explicitly
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
      await fetchMembers();
      router.refresh();
      setSearchQuery("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Users className="w-4 h-4" />
          Add Members
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
          <DialogTitle className="sr-only">Add members</DialogTitle>
          <div className="relative">
            <Input
              placeholder="Add members"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-base font-medium py-6"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {searchQuery ? (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">
                Search results
              </h4>
              {isSearching ? (
                <p className="text-sm text-muted-foreground">Searching...</p>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </div>
                    <Select
                      onValueChange={(val) => handleAddMember(user.id, val)}
                    >
                      <SelectTrigger className="w-[110px] h-9">
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
                <p className="text-sm text-muted-foreground">No users found.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">
                Existing members
              </h4>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : members.length > 0 ? (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                          {member.users.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {member.users.name || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {member.users.email}
                        </span>
                      </div>
                    </div>
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
                        <SelectItem value="reviewer">Reviewer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem
                          value="Remove"
                          className="text-destructive focus:text-destructive"
                        >
                          Remove
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No existing members.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
