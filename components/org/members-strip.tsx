import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type OrgMemberRecord = {
  id: string;
  user_id: string;
  role: "admin" | "reviewer";
  users: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

const ROLE_BADGE_STYLES: Record<OrgMemberRecord["role"], string> = {
  admin: "border-purple-200 bg-white text-purple-900 shadow-sm",
  reviewer: "border-purple-200 bg-white text-purple-900 shadow-sm",
};

type MembersStripProps = {
  members: OrgMemberRecord[];
};

export function MembersStrip({ members }: MembersStripProps) {
  const count = members.length;
  if (count === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-6 text-center text-sm text-slate-500">
        No members have joined this organization yet.
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 pt-2 pr-1">
      {members.map((member) => {
        const displayName =
          member.users?.name?.trim() || member.users?.email || "Unknown";
        const initial = displayName.charAt(0).toUpperCase() || "U";

        return (
          <article
            key={member.id}
            className="flex min-w-[180px] max-w-[240px] flex-col gap-3 rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-muted text-muted-foreground text-base">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex flex-col gap-1">
                <p className="text-sm font-semibold text-slate-900 truncate leading-none">
                  {displayName}
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "self-start text-[11px] uppercase tracking-[0.2em]",
                    ROLE_BADGE_STYLES[member.role],
                  )}
                >
                  {member.role === "admin" ? "Admin" : "Reviewer"}
                </Badge>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
