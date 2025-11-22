/**
 * Job Openings Page
 *
 * Public page displaying all available job openings across organizations.
 * Users can browse and view openings to apply.
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OpeningsGrid } from "./components/OpeningsGrid";

export default async function ApplyPage() {
  const supabase = await createClient();

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // Fetch all job openings with organization details (joined with orgs table)
  const { data: openings } = await supabase
    .from('openings')
    .select(`
      id,
      org_id,
      title,
      description,
      orgs!org_id (
        id,
        name,
        description
      )
    `);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Job Openings</h1>
          <p className="text-muted-foreground">
            Browse and apply to open positions across organizations
          </p>
        </div>

        {/* Openings Grid with Details Modal */}
        <OpeningsGrid openings={openings || []} />
      </div>
    </div>
  );
}
