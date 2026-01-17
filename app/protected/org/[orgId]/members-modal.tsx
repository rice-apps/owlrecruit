"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface Member {
  id: string;
  role: string;
  users:
    | { id: string; name: string | null; email: string }
    | { id: string; name: string | null; email: string }[]
    | null;
}

interface MembersModalProps {
  orgId: string;
  trigger?: React.ReactNode;
}

export function MembersModal({ orgId, trigger }: MembersModalProps) {
  const [open, setOpen] = React.useState(false);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Fetch org members when dialog opens
  React.useEffect(() => {
    if (open) {
      const fetchMembers = async () => {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("org_members")
          .select(
            `
            id,
            role,
            users:user_id (
              id,
              name,
              email
            )
          `,
          )
          .eq("org_id", orgId);

        if (!error && data) {
          setMembers(data);
        }
        setLoading(false);
      };

      fetchMembers();
    }
  }, [open, orgId]);

  // Get initials from name
  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Add Members</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="sr-only">Organization Members</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Search Input */}
          <Input
            placeholder="Add members..."
            disabled
            className="h-12 text-base"
          />

          {/* Users Label */}
          <div className="text-sm text-gray-500 font-medium">Users</div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {loading ? (
              <div className="text-center py-12 text-gray-500">
                Loading members...
              </div>
            ) : members.length > 0 ? (
              <div>
                {members.map((member) => {
                  const user = Array.isArray(member.users)
                    ? member.users[0]
                    : member.users;
                  const name = user?.name || "Unknown User";
                  const email = user?.email || "";

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                    >
                      {/* Avatar with initials */}
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold flex-shrink-0">
                        {getInitials(name)}
                      </div>

                      {/* User info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {email}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No members in this organization.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
