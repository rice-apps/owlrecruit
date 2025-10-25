/**
 * Admin Club Dashboard Page
 * 
 * Main admin dashboard for managing a specific club/organization.
 */

import { createClient } from "@/lib/supabase/server";
import { KanbanBoard } from "../../components";

interface Application {
  id: string;
  org_id: string;
  applicant_id: string;
  position: string;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  users: {
    id: string;
    name: string;
    net_id: string;
    email: string;
  };
}

interface AdminClubPageProps {
  params: { id: string };
}

export default async function AdminClubPage({ params }: AdminClubPageProps) {
  const { id: orgId } = await params;
  const supabase = await createClient();

  // Fetch applications with user data in one query
  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      id,
      org_id,
      applicant_id,
      position,
      status,
      notes,
      created_at,
      updated_at,
      users:applicant_id (
        id,
        name,
        net_id,
        email
      )
    `)
    .eq('org_id', orgId);



  // Transform the data to match the Application interface
  const transformedApplications: Application[] = (applications || []).map(app => ({
    ...app,
    users: Array.isArray(app.users) ? app.users[0] : app.users
  }));

  return (
    <div className="space-y-6">
      <KanbanBoard applications={transformedApplications} />
    </div>
  );
}

// Export the interface for use in other components
export type { Application };