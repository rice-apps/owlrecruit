/**
 * Opening Data Functions
 *
 * Shared data fetching logic for openings.
 */

import { createClient } from "@/lib/supabase/server";

export interface OpeningApplicant {
  id: string;
  name: string;
  email: string;
  netId: string;
  status: string;
  applicationId: string;
}

export interface OpeningData {
  org: { name: string } | null;
  opening: { title: string; description: string; status: string } | null;
  applicants: OpeningApplicant[];
}

export async function getOpeningData(
  orgId: string,
  openingId: string,
): Promise<OpeningData> {
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
    .select("title, description, status")
    .eq("id", openingId)
    .single();

  // Fetch applications with user data for this specific opening
  const { data: applications } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      users:applicant_id (
        id,
        name,
        net_id,
        email
      )
    `,
    )
    .eq("opening_id", openingId);

  // Transform applications to applicants list format
  const applicants = (applications || [])
    .filter((app) => app.users !== null)
    .map((app) => {
      const user = Array.isArray(app.users) ? app.users[0] : app.users;
      return {
        id: user.id,
        name: user.name || "-",
        email: user.email || `${user.net_id}@rice.edu`,
        netId: user.net_id,
        status: app.status || "No Status",
        applicationId: app.id,
      };
    });

  return {
    org: orgData,
    opening: openingData,
    applicants,
  };
}
