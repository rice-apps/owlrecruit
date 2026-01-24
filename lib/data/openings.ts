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

  // Single optimized query using joins
  const { data } = await supabase
    .from("openings")
    .select(
      `
      title,
      description,
      status,
      orgs!openings_org_fkey(name),
      applications(
        id,
        status,
        applicants:applicant_id(id, name, net_id)
      )
    `,
    )
    .eq("id", openingId)
    .eq("org_id", orgId)
    .single();

  // Transform to expected format
  const orgs = data?.orgs as { name: string } | { name: string }[] | null;
  const orgName = Array.isArray(orgs) ? orgs[0]?.name : orgs?.name;
  const orgData = orgName ? { name: orgName } : null;
  const openingData = data
    ? { title: data.title, description: data.description, status: data.status }
    : null;

  const applicants = (data?.applications || [])
    .filter((app) => app.applicants !== null)
    .map((app) => {
      const applicant = Array.isArray(app.applicants)
        ? app.applicants[0]
        : app.applicants;
      return {
        id: applicant.id,
        name: applicant.name || "-",
        email: `${applicant.net_id}@rice.edu`,
        netId: applicant.net_id,
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
