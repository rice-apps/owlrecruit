import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ApplicationsView } from "./applications-view";
import { ApplicationWithDetails } from "@/components/application-card";

export default async function ApplicationsPage() {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    redirect("/");
  }
  const userId = userData.user.id;

  // 1. Get User's NetID from users table
  const { data: userRecord, error: userRecordError } = await supabase
    .from("users")
    .select("net_id")
    .eq("id", userId)
    .single();

  if (userRecordError || !userRecord?.net_id) {
    // If no user record or no net_id, return empty list
    return (
      <div className="flex flex-col gap-6 w-full p-6 max-w-7xl mx-auto">
        <ApplicationsView initialApplications={[]} />
      </div>
    );
  }

  // 2. Find Applicant ID from applicants table using NetID
  const { data: applicantData, error: applicantError } = await supabase
    .from("applicants")
    .select("id")
    .eq("net_id", userRecord.net_id)
    .single();

  if (applicantError || !applicantData) {
    // No applicant record found for this NetID
    return (
      <div className="flex flex-col gap-6 w-full p-6 max-w-7xl mx-auto">
        <ApplicationsView initialApplications={[]} />
      </div>
    );
  }

  // 3. Fetch Applications for this applicant_id
  const { data: applications, error: applicationsError } = await supabase
    .from("applications")
    .select(
      `
      *,
      opening:openings (
        title,
        closes_at,
        org:orgs (
          name
        )
      )
    `,
    )
    .eq("applicant_id", applicantData.id);

  if (applicationsError) {
    console.error("Error fetching applications:", applicationsError);
    // Handle error appropriately, maybe show empty state or error message
    // For now, passing empty array
  }

  // Cast the data to the expected type
  // Note: We need to ensure the query returns the structure matching ApplicationWithDetails
  // The query above fetches opening -> org.
  const formattedApplications = (applications ||
    []) as unknown as ApplicationWithDetails[];

  return (
    <div className="flex flex-col gap-6 w-full p-6 max-w-7xl mx-auto">
      <ApplicationsView initialApplications={formattedApplications} />
    </div>
  );
}
