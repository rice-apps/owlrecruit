"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Modal,
  TextInput,
  Button,
  Select,
  Avatar,
  Text,
  Group,
  Stack,
  Box,
  Badge,
  Loader,
  Paper,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Users01 } from "@untitled-ui/icons-react";
import { logger } from "@/lib/logger";

type Member = {
  id: string;
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
      const json = await res.json();
      setMembers((json.data ?? json) as Member[]);
    } catch (error) {
      logger.error("Failed to fetch members:", error);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  // Reset state when dialog opens
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

  // Search
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
          const json = await res.json();
          setSearchResults((json.data ?? json) as SearchedUser[]);
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

  const handleAddMember = (user: SearchedUser, role: "admin" | "reviewer") => {
    const newMember: Member = {
      id: `pending-${user.id}`,
      role,
      user_id: user.id,
      users: { id: user.id, name: user.name, email: user.email },
    };
    setMembers((prev) => [...prev, newMember]);

    setPendingAdds((prev) => {
      const next = new Map(prev);
      next.set(user.id, { user, role });
      return next;
    });

    setPendingRemovals((prev) => {
      if (prev.has(user.id)) {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      }
      return prev;
    });

    setSearchResults((prev) => prev.filter((u) => u.id !== user.id));
    setSearchQuery("");
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
        setMembers((prev) => prev.filter((m) => m.user_id !== userId));
        setPendingAdds((prev) => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      } else {
        setPendingRemovals((prev) => {
          const next = new Set(prev);
          next.add(userId);
          return next;
        });
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
    setMembers((prev) =>
      prev.map((m) => (m.user_id === userId ? { ...m, role: typedRole } : m)),
    );

    if (pendingAdds.has(userId)) {
      setPendingAdds((prev) => {
        const next = new Map(prev);
        const existing = next.get(userId)!;
        next.set(userId, { ...existing, role: typedRole });
        return next;
      });
    } else {
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

      for (const [userId, { role }] of pendingAdds) {
        promises.push(
          fetch(`/api/org/${orgId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, role }),
          }),
        );
      }

      for (const [userId, role] of pendingRoleChanges) {
        promises.push(
          fetch(`/api/org/${orgId}/members/${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role }),
          }),
        );
      }

      for (const userId of pendingRemovals) {
        promises.push(
          fetch(`/api/org/${orgId}/members/${userId}`, { method: "DELETE" }),
        );
      }

      await Promise.all(promises);
      router.refresh();
      setOpen(false);
    } catch (error) {
      logger.error("Failed to save changes:", error);
      notifications.show({
        color: "red",
        message: "Failed to save changes. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSearchResults = searchResults.filter(
    (user) => !members.some((m) => m.user_id === user.id),
  );

  const isLastAdmin = (userId: string) =>
    members.filter((m) => m.role === "admin" && !pendingRemovals.has(m.user_id))
      .length === 1 &&
    members.find((m) => m.user_id === userId)?.role === "admin";

  return (
    <>
      <Button
        leftSection={<Users01 width={16} height={16} />}
        variant="default"
        onClick={() => setOpen(true)}
      >
        Edit Members
      </Button>

      <Modal
        opened={open}
        onClose={() => setOpen(false)}
        title="Edit members"
        size="md"
        styles={{
          body: { display: "flex", flexDirection: "column", gap: "1rem" },
        }}
      >
        {/* Search */}
        <Box ref={searchContainerRef} style={{ position: "relative" }}>
          <TextInput
            placeholder="Search to add members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            rightSection={isSearching ? <Loader size="xs" /> : null}
          />

          {searchQuery && (
            <Paper
              shadow="md"
              withBorder
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "100%",
                zIndex: 200,
                marginTop: 4,
                maxHeight: 240,
                overflowY: "auto",
                padding: "0.5rem",
              }}
            >
              {isSearching ? (
                <Text size="sm" c="dimmed" p="xs">
                  Searching...
                </Text>
              ) : filteredSearchResults.length > 0 ? (
                filteredSearchResults.map((user) => (
                  <Box
                    key={user.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      padding: "0.5rem",
                      borderRadius: 6,
                    }}
                  >
                    <Group gap="sm">
                      <Avatar
                        size={32}
                        radius="md"
                        color="initials"
                        name={user.name}
                      />
                      <div>
                        <Text size="sm" fw={500}>
                          {user.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {user.email}
                        </Text>
                      </div>
                    </Group>
                    <Select
                      size="xs"
                      w={110}
                      placeholder="Add as..."
                      data={[
                        { value: "reviewer", label: "Reviewer" },
                        { value: "admin", label: "Admin" },
                      ]}
                      onChange={(val) => {
                        if (val)
                          setTimeout(
                            () =>
                              handleAddMember(
                                user,
                                val as "admin" | "reviewer",
                              ),
                            0,
                          );
                      }}
                    />
                  </Box>
                ))
              ) : (
                <Text size="sm" c="dimmed" p="xs">
                  No users found.
                </Text>
              )}
            </Paper>
          )}
        </Box>

        {/* Members list */}
        <Box style={{ flex: 1, overflowY: "auto", maxHeight: 320 }}>
          <Text fw={600} size="sm" mb="xs">
            Members
          </Text>
          {isLoading ? (
            <Text size="sm" c="dimmed">
              Loading...
            </Text>
          ) : members.length > 0 ? (
            <Stack gap="xs">
              {members.map((member) => {
                const isPendingRemoval = pendingRemovals.has(member.user_id);
                const isPendingAdd = pendingAdds.has(member.user_id);

                return (
                  <Group
                    key={member.id}
                    justify="space-between"
                    gap="sm"
                    style={{
                      padding: "0.5rem",
                      borderRadius: 8,
                      opacity: isPendingRemoval ? 0.5 : 1,
                      background: isPendingAdd
                        ? "var(--mantine-color-owlTeal-0)"
                        : "transparent",
                    }}
                  >
                    <Group gap="sm">
                      <Avatar
                        size={40}
                        radius="md"
                        color="initials"
                        name={member.users.name || ""}
                      />
                      <div>
                        <Group gap="xs">
                          <Text
                            size="sm"
                            fw={500}
                            style={{
                              textDecoration: isPendingRemoval
                                ? "line-through"
                                : "none",
                            }}
                          >
                            {member.users.name || "Unknown"}
                          </Text>
                          {isPendingAdd && (
                            <Badge size="xs" variant="filled" color="owlTeal">
                              New
                            </Badge>
                          )}
                        </Group>
                        <Text size="xs" c="dimmed">
                          {member.users.email}
                        </Text>
                      </div>
                    </Group>

                    {isPendingRemoval ? (
                      <Button
                        variant="subtle"
                        size="xs"
                        color="gray"
                        onClick={() => handleUndoRemoval(member.user_id)}
                      >
                        Undo
                      </Button>
                    ) : (
                      <Select
                        size="xs"
                        w={120}
                        value={member.role}
                        data={[
                          {
                            value: "reviewer",
                            label: "Reviewer",
                            disabled: isLastAdmin(member.user_id),
                          },
                          { value: "admin", label: "Admin" },
                          ...(!isLastAdmin(member.user_id)
                            ? [{ value: "Remove", label: "Remove" }]
                            : []),
                        ]}
                        onChange={(val) =>
                          val && handleRoleChange(member.user_id, val)
                        }
                      />
                    )}
                  </Group>
                );
              })}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">
              No existing members.
            </Text>
          )}
        </Box>

        <Button onClick={handleDone} loading={isSaving} fullWidth>
          Done
        </Button>
      </Modal>
    </>
  );
}
