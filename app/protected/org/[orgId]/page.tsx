import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button, Text, Alert } from "@mantine/core";
import { Plus } from "@untitled-ui/icons-react";
import { EditMembersDialog } from "@/components/edit-members-dialog";
import {
  MembersStrip,
  type OrgMemberRecord,
} from "@/components/org/members-strip";
import { OrgPageHeader } from "@/components/org/org-page-header";
import { SectionShell } from "@/components/org/section-shell";
import { OrgSectionNav } from "@/components/org-section-nav";
import { LeaveOrgButton } from "@/components/leave-org-button";
import { logger } from "@/lib/logger";
import { OpeningsGrid } from "./components/openings-grid";

interface ReviewerOrgPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function ReviewerOrgPage({
  params,
}: ReviewerOrgPageProps) {
  const { orgId } = await params;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  const { data: membership, error: membershipError } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .single();

  if (membershipError) {
    logger.error("Failed to fetch org membership", {
      orgId,
      userId,
      code: membershipError.code,
      message: membershipError.message,
    });
  }

  const membershipRole =
    membership?.role === "admin" || membership?.role === "reviewer"
      ? membership.role
      : null;
  const isAdmin = membershipRole === "admin";

  const { data: orgData } = await supabase
    .from("orgs")
    .select("name, description, logo_url")
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
    logger.error("Failed to fetch org members", {
      orgId,
      code: membersError.code,
      message: membersError.message,
    });
  }

  const members: OrgMemberRecord[] = (membersData ?? []).map((m) => {
    const usersRaw = m.users;
    const user = Array.isArray(usersRaw) ? usersRaw[0] : usersRaw;
    return {
      id: m.id,
      user_id: m.user_id,
      role: m.role as "admin" | "reviewer",
      users: user ?? null,
    };
  });

  const displayOrgName = orgData?.name || "Organization";
  const roleLabel = membershipError
    ? "ROLE UNAVAILABLE"
    : membershipRole === "admin"
      ? "ADMIN"
      : membershipRole === "reviewer"
        ? "REVIEWER"
        : "ROLE UNKNOWN";

  const memberCountLabel = membersError
    ? "Members unavailable"
    : members.length
      ? `${members.length} ${members.length === 1 ? "collaborator" : "collaborators"}`
      : "No members yet";

  const memberSectionSubtitle = membersError
    ? "Could not load the roster right now"
    : members.length
      ? "Current roster of reviewers and admins"
      : "Invite collaborators via Edit Members";

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        maxWidth: 960,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        paddingBottom: "6rem",
      }}
    >
      <OrgPageHeader
        orgId={orgId}
        displayOrgName={displayOrgName}
        orgDescription={orgData?.description ?? null}
        roleLabel={roleLabel}
        isAdmin={isAdmin}
        hasRoleError={Boolean(membershipError)}
        logoUrl={orgData?.logo_url ?? null}
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
        <Text size="md" c="dimmed" style={{ lineHeight: 1.7 }}>
          {orgData?.description ||
            "This organization has not added an about section yet."}
        </Text>
      </SectionShell>

      <SectionShell
        id="positions"
        title="Positions"
        subtitle="Open roles for this organization"
        actions={
          isAdmin ? (
            <Button
              component={Link}
              href={`/protected/org/${orgId}/new-opening`}
              size="xs"
              variant="light"
              leftSection={<Plus width={14} height={14} />}
            >
              Add position
            </Button>
          ) : null
        }
      >
        <OpeningsGrid
          openings={openings ?? []}
          orgId={orgId}
          orgName={displayOrgName}
          isAdmin={isAdmin}
        />
      </SectionShell>

      <SectionShell
        id="members"
        title="Members"
        subtitle={memberSectionSubtitle}
        actions={
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <Text
              size="xs"
              fw={600}
              c="dimmed"
              style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
            >
              {memberCountLabel}
            </Text>
            {isAdmin && <EditMembersDialog orgId={orgId} />}
          </div>
        }
      >
        {membersError ? (
          <Alert color="yellow">
            Could not load members right now. Refresh and try again.
          </Alert>
        ) : members.length > 0 ? (
          <MembersStrip members={members} />
        ) : (
          <Text size="sm" c="dimmed">
            No members yet. Invite collaborators via Edit Members.
          </Text>
        )}
      </SectionShell>

      <section
        id="leave-organization"
        tabIndex={-1}
        style={{ paddingTop: 4, paddingBottom: "2rem" }}
      >
        <LeaveOrgButton
          orgId={orgId}
          userId={userId!}
          isAdmin={isAdmin}
          orgName={displayOrgName}
        />
      </section>
    </div>
  );
}
