/**
 * Opening Overview Page
 *
 * Displays the kanban board for a specific opening in an organization.
 */

import { createClient } from "@/lib/supabase/server";
import KanbanBoard from "./components/KanbanBoard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Application {
  id: string;
  org_id: string;
  opening_id: string;
  applicant_id: string;
  position: string; // This will be derived from opening title
  status: string;
  notes: string; // This will be derived from form_responses
  form_responses?: Record<string, unknown>;
  url?: string;
  created_at: string;
  updated_at: string;
  users: {
    id: string;
    name: string;
    net_id: string;
    email: string;
  };
  reviewScore?: number | null;
}

interface OpeningOverviewPageProps {
  params: { orgId: string; openingId: string };
}

export default async function OpeningOverviewPage({
  params,
}: OpeningOverviewPageProps) {
  const { orgId, openingId } = await params;
  const supabase = await createClient();

  // Fetch the organization name
  const { data: orgData } = await supabase
    .from("orgs")
    .select("name")
    .eq("id", orgId)
    .single();

  // Fetch the opening details
  const { data: openingData } = await supabase
    .from("openings")
    .select("title, description")
    .eq("opening_id", openingId)
    .single();

  // Fetch applications with user data for this specific opening
  const { data: applications } = await supabase
    .from("applications")
    .select(
      `
      id,
      org_id,
      opening_id,
      applicant_id,
      status,
      form_responses,
      created_at,
      updated_at,
      url,
      users:applicant_id (
        id,
        name,
        net_id,
        email
      ), 
      application_reviews (
        score
      )
    `,
    )
    .eq("opening_id", openingId);

  // Transform the data to match the Application interface
  const transformedApplications: Application[] = (applications || []).map(
    (app) => ({
      ...app,
      users: Array.isArray(app.users) ? app.users[0] : app.users,
      reviewScore: Array.isArray(app.application_reviews)
        ? app.application_reviews[0]?.score
        : null,
      // Map form_responses to notes for backward compatibility with the kanban board
      notes: app.form_responses ? JSON.stringify(app.form_responses) : "",
      // Add position from opening title for display
      position: openingData?.title || "Unknown Position",
    }),
  );

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <Link
        href={`/protected/reviewer/${orgId}`}
        className="flex items-center gap-2 w-fit text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <h1 className="text-3xl font-bold">{orgData?.name || "Organization"}</h1>

      {openingData?.description && (
        <p className="text-lg text-muted-foreground">
          {openingData.description}
        </p>
      )}

      <div className="space-y-6">
        {transformedApplications.length > 0 ? (
          <KanbanBoard applications={transformedApplications} />
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No Applications Found
            </h3>
            <p className="text-sm text-muted-foreground">
              There are no applications for this opening yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Export the interface for use in other components
export type { Application };
