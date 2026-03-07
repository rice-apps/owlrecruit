import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get User's NetID from users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("net_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.net_id) {
      // If no user record or no net_id, they can't have applications as an applicant
      return NextResponse.json([]);
    }

    // 2. Find Applicant ID from applicants table using NetID
    const { data: applicantData, error: applicantError } = await supabase
      .from("applicants")
      .select("id")
      .eq("net_id", userData.net_id)
      .single();

    if (applicantError || !applicantData) {
      return NextResponse.json([]);
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
      throw new Error(applicationsError.message);
    }

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching user applications:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
