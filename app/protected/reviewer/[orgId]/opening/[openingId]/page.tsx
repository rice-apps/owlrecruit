/**
 * Opening Overview Page
 *
 * Displays kanban board for a specific opening and CSV upload functionality.
 * Route: /protected/reviewer/[orgId]/opening/[openingId]
 */

import { createClient } from "@/lib/supabase/server";
import { KanbanBoard } from "@/app/protected/dashboard/clubs/components";
import UploadDialog from "./upload-modal";

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
  reviewScore?: number | null;
}

interface Opening {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
}

interface OpeningPageProps {
  params: { orgId: string; openingId: string };
}

export default async function OpeningPage({ params }: OpeningPageProps) {
  const { orgId, openingId } = await params;
  const supabase = await createClient();

  // Fetch opening details
  const { data: opening, error: openingError } = await supabase
    .from("openings")
    .select("id, org_id, title, description")
    .eq("id", openingId)
    .eq("org_id", orgId)
    .single();

  if (openingError || !opening) {
    return (
      <div className="space-y-6">
        <h1 className="font-bold text-3xl">Opening Not Found</h1>
        <p className="text-muted-foreground">
          The opening you are looking for does not exist or you do not have
          access to it.
        </p>
      </div>
    );
  }

  // Fetch applications for this specific opening
  const { data: applications, error } = await supabase
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

  if (error) {
    console.error("Error fetching applications:", error);
  }

  console.log("Fetched applications:", applications);

  // Transform the data to match the Application interface
  const transformedApplications: Application[] = (applications || []).map(
    (app) => ({
      ...app,
      position: "",
      notes: "",
      users: Array.isArray(app.users) ? app.users[0] : app.users,
      reviewScore: Array.isArray(app.application_reviews)
        ? app.application_reviews[0]?.score
        : null,
    }),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">{opening.title}</h1>
          {opening.description && (
            <p className="text-muted-foreground mt-2">{opening.description}</p>
          )}
        </div>
        <UploadDialog openingId={openingId} />
      </div>

      {/* Kanban Board */}
      <KanbanBoard applications={transformedApplications} />
    </div>
  );
}

export type { Application, Opening };
