import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  props: { params: Promise<{ orgId: string; openingId: string }> },
) {
  const params = await props.params;
  const { openingId } = params;
  const supabase = await createClient();

  try {
    // 1. Check authentication (middleware usually handles this, but good to be safe/explicit if needed for RLS)
    // For now assuming RLS and middleware cover basic auth access.

    // 2. Fetch all applications for this opening
    // prioritizing minimal data size since we just need to know WHO applied.
    // Fetching applicant_id and net_id is useful for deduplication.
    const { data: applications, error } = await supabase
      .from("applications")
      .select(
        `
        applicant_id,
        users:applicant_id (
          net_id,
          name
        )
      `,
      )
      .eq("opening_id", openingId);

    if (error) {
      console.error("Error fetching applicants:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Flatten the response to a list of net_ids (and IDs if needed)
    // We want a quick lookup Map or Set of NetIDs -> ApplicationExists

    const existingApplicants = applications
      .filter((app) => app.users) // Ensure user exists
      .map((app) => {
        const user = Array.isArray(app.users) ? app.users[0] : app.users;
        return {
          netId: user.net_id,
          applicantId: app.applicant_id, // app.applicant_id is the ID in the applicants table
          name: user.name,
        };
      });

    return NextResponse.json({ applicants: existingApplicants });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
