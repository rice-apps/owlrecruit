/**
 * Organization Management Page
 *
 * Main admin page for managing an organization.
 * Allows admins to:
 * - Manage organization settings (name, etc.)
 * - Create and delete openings
 * - Navigate to Kanban board for applicant management
 * - Manage reviewers and admins
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OrganizationHeader } from "./components/OrganizationHeader";
import { OpeningsManager } from "./components/OpeningsManager";
import { TeamManager } from "./components/TeamManager";
import { QuickActions } from "./components/QuickActions";

interface OrgManagePageProps {
  params: { id: string };
}

export default async function OrgManagePage({ params }: OrgManagePageProps) {
  const { id: orgId } = await params;
  const supabase = await createClient();

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // Fetch organization details
  const { data: org, error: orgError } = await supabase
    .from('orgs')
    .select('*')
    .eq('id', orgId)
    .single();

  if (orgError || !org) {
    redirect('/protected/dashboard');
  }

  // Verify user is admin of this org
  const { data: adminRecord } = await supabase
    .from('admin')
    .select('id')
    .eq('id', user.id)
    .eq('org_id', orgId)
    .single();

  if (!adminRecord) {
    redirect('/protected/dashboard');
  }

  // Fetch openings for this organization
  const { data: openings } = await supabase
    .from('openings')
    .select('*')
    .eq('org_id', orgId);

  // Fetch admins for this organization
  const { data: rawAdmins } = await supabase
    .from('admin')
    .select(`
      id,
      name,
      org_id
    `)
    .eq('org_id', orgId);

  // Fetch reviewers for this organization
  const { data: reviewers } = await supabase
    .from('reviewers')
    .select('*')
    .eq('org_id', orgId);

  // Fetch application statistics
  const { count: totalApplications } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId);

  const { count: pendingApplications } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'applied');

  // Calculate unique team member count to avoid double-counting
  // (since a person can be both an admin AND a reviewer)
  const adminIds = new Set(rawAdmins?.map(a => a.id) || []);
  const reviewerIds = new Set(reviewers?.map(r => r.id) || []);
  const uniqueTeamMemberIds = new Set([...adminIds, ...reviewerIds]);
  const totalTeamMembers = uniqueTeamMemberIds.size;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-8">
        {/* Back Navigation */}
        <div className="flex items-center gap-4">
          <Link
            href="/protected/dashboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to My Organizations
          </Link>
        </div>

        {/* Organization Header */}
        <OrganizationHeader
          org={org}
          stats={{
            totalApplications: totalApplications || 0,
            pendingApplications: pendingApplications || 0,
            totalOpenings: openings?.length || 0,
            totalAdmins: rawAdmins?.length || 0,
            totalReviewers: reviewers?.length || 0,
            totalTeamMembers
          }}
        />

        {/* Quick Actions */}
        <QuickActions orgId={orgId} />

        {/* Openings Manager */}
        <OpeningsManager
          orgId={orgId}
          openings={openings || []}
        />

        {/* Admins and Reviewers Manager */}
        <TeamManager
          orgId={orgId}
          admins={rawAdmins || []}
          reviewers={reviewers || []}
        />
      </div>
    </div>
  );
}
