import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { OpeningFormDialog } from "@/components/opening-form-dialog";
import { OpeningStatusBadge } from "@/components/status-badge";
import { AddMembersDialog } from "@/components/add-members-dialog";
import {
  MembersStrip,
  type OrgMemberRecord,
} from "@/components/org/members-strip";
import { OrgPageHeader } from "@/components/org/org-page-header";
import {
  SectionShell,
  sectionShellTokens,
} from "@/components/org/section-shell";
import { OrgSectionNav } from "@/components/org-section-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RawMemberUser = NonNullable<OrgMemberRecord["users"]>;

type RawMemberResult = {
  id: string;
  user_id: string;
  role: OrgMemberRecord["role"];
  users: RawMemberUser | RawMemberUser[] | null;
};

function isMemberRole(value: unknown): value is OrgMemberRecord["role"] {
  return value === "admin" || value === "reviewer";
}

function isRawMemberUser(value: unknown): value is RawMemberUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    (typeof candidate.name === "string" || candidate.name === null) &&
    (typeof candidate.email === "string" || candidate.email === null)
  );
}

function isRawMemberResult(value: unknown): value is RawMemberResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const users = candidate.users;
  const usersAreValid =
    users === null ||
    isRawMemberUser(users) ||
    (Array.isArray(users) && users.every((entry) => isRawMemberUser(entry)));

  return (
    typeof candidate.id === "string" &&
    typeof candidate.user_id === "string" &&
    isMemberRole(candidate.role) &&
    usersAreValid
  );
}

interface ReviewerOrgPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function ReviewerOrgPage({
  params,
}: ReviewerOrgPageProps) {
  const { orgId } = await params;
  const supabase = await createClient();

  const pageLayoutClass =
    "overflow-x-hidden pb-24 md:pb-28 flex-1 w-full max-w-5xl min-w-0 flex flex-col gap-6";

  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  const { data: membership, error: membershipError } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .single();

  if (membershipError) {
    console.error("Failed to fetch org membership", {
      orgId,
      userId,
      code: membershipError.code,
      message: membershipError.message,
    });
  }

  const membershipRole = isMemberRole(membership?.role)
    ? membership.role
    : null;
  const isAdmin = membershipRole === "admin";

  const { data: orgData } = await supabase
    .from("orgs")
    .select("name, description")
    .eq("id", orgId)
    .single();

  const { data: openings } = await supabase
    .from("openings")
    .select("id, title, description, status, closes_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  const { data: membersData, error: membersError } = await supabase
    .from("org_members")
    .select(
      `
        id,
        user_id,
        role,
        users:user_id (
          id,
          name,
          email
        )
      `,
    )
    .eq("org_id", orgId)
    .order("role", { ascending: true })
    .order("user_id", { ascending: true });

  if (membersError) {
    console.error("Failed to fetch org members", {
      orgId,
      code: membersError.code,
      message: membersError.message,
    });
  }

  const rawMembers =
    membersError || !Array.isArray(membersData)
      ? []
      : membersData.filter((member) => isRawMemberResult(member));

  const normalizeUser = (
    users: RawMemberResult["users"],
  ): OrgMemberRecord["users"] => {
    if (Array.isArray(users)) {
      return users.length > 0 ? users[0] : null;
    }
    return users ?? null;
  };

  const members: OrgMemberRecord[] = rawMembers.map((member) => ({
    id: member.id,
    user_id: member.user_id,
    role: member.role,
    users: normalizeUser(member.users),
  }));

  const membersState = membersError
    ? "error"
    : members.length > 0
      ? "loaded"
      : "empty";
  const memberCountLabel =
    membersState === "error"
      ? "Members unavailable"
      : members.length
        ? `${members.length} ${members.length === 1 ? "collaborator" : "collaborators"}`
        : "No members yet";
  const memberSectionSubtitle =
    membersState === "error"
      ? "Could not load the roster right now"
      : members.length
        ? "Current roster of reviewers and admins"
        : "Invite collaborators via Add Members";

  const displayOrgName = orgData?.name || "Organization";
  const roleLabel = membershipError
    ? "ROLE UNAVAILABLE"
    : membershipRole === "admin"
      ? "ADMIN"
      : membershipRole === "reviewer"
        ? "REVIEWER"
        : "ROLE UNKNOWN";

  return (
    <div className={pageLayoutClass}>
      <OrgPageHeader
        displayOrgName={displayOrgName}
        roleLabel={roleLabel}
        isAdmin={isAdmin}
        hasRoleError={Boolean(membershipError)}
      />

      <OrgSectionNav
        sections={[
          { id: "about", label: "About" },
          { id: "positions", label: "Positions" },
          { id: "members", label: "Members" },
        ]}
      />

      <SectionShell
        id="about"
        title="About"
        subtitle="Summary and current context"
      >
        <p
          className={`text-base leading-relaxed ${sectionShellTokens.mutedCopy}`}
        >
          {orgData?.description ||
            "This organization has not added an about section yet."}
        </p>
      </SectionShell>

      <SectionShell
        id="positions"
        title="Positions"
        subtitle="Open roles for this organization"
        actions={
          isAdmin ? (
            <OpeningFormDialog
              orgId={orgId}
              orgName={displayOrgName}
              trigger={
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-rose-600 shadow-sm transition hover:border-rose-300 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                >
                  <span>Add new position</span>
                  <span aria-hidden="true" className="text-base font-bold">
                    +
                  </span>
                </button>
              }
            />
          ) : null
        }
      >
        {openings && openings.length > 0 ? (
          <div
            className={`grid ${sectionShellTokens.cardSpacing} md:grid-cols-2 lg:grid-cols-3`}
          >
            {openings.map((opening) => (
              <Link
                key={opening.id}
                href={`/protected/org/${orgId}/opening/${opening.id}`}
              >
                <Card className="group h-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="h-1 w-full bg-gradient-to-r from-rose-200/80 via-rose-100 to-rose-50" />
                  <CardHeader className="px-4 pt-3 pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-lg leading-tight">
                        {opening.title || "Untitled Opening"}
                      </CardTitle>
                      <OpeningStatusBadge status={opening.status || "draft"} />
                    </div>
                    {opening.closes_at && (
                      <p className="text-xs text-slate-400">
                        Due:{" "}
                        {new Date(opening.closes_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </p>
                    )}
                  </CardHeader>
                  {opening.description && (
                    <CardContent className="px-4 pb-4 pt-0">
                      <p className="text-sm text-slate-500 line-clamp-3">
                        {opening.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200/80 bg-white/70 px-6 py-12 text-center">
            <h3 className="text-lg font-medium text-gray-600">
              No Openings Yet
            </h3>
            <p className={`text-sm ${sectionShellTokens.mutedCopy}`}>
              {isAdmin
                ? "Create your first opening to start recruiting."
                : "There are no openings for this organization yet."}
            </p>
          </div>
        )}
      </SectionShell>

      <SectionShell
        id="members"
        title="Members"
        subtitle={memberSectionSubtitle}
        actions={
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              {memberCountLabel}
            </span>
            {isAdmin && <AddMembersDialog orgId={orgId} />}
          </div>
        }
      >
        {membersError ? (
          <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-amber-200/80 bg-amber-50/60 px-5 py-6">
            <p className={sectionShellTokens.mutedCopy}>
              Could not load members right now. Refresh and try again.
            </p>
          </div>
        ) : members.length > 0 ? (
          <MembersStrip members={members} />
        ) : (
          <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-slate-200/70 bg-slate-50/80 px-5 py-6">
            <p className={sectionShellTokens.mutedCopy}>
              No members yet. Invite collaborators via Add Members.
            </p>
          </div>
        )}
      </SectionShell>

      <section
        id="leave-organization"
        tabIndex={-1}
        className="min-w-0 w-full pt-1 pb-8"
      >
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="text-left text-lg font-semibold tracking-tight text-red-500 transition sm:text-xl disabled:cursor-not-allowed disabled:opacity-100"
        >
          Leave organization
        </button>
      </section>
    </div>
  );
}
