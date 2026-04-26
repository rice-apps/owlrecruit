import { createClient } from "@/lib/supabase/server";
import { createRequestLogger } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function GET() {
  const log = createRequestLogger({
    method: "GET",
    path: "/api/user/applications",
  });
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.flush(401);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    log.set({ user_id: user.id });

    // 1. Get User's NetID from users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("net_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.net_id) {
      // If no user record or no net_id, they can't have applications as an applicant
      log.flush(200);
      return NextResponse.json([]);
    }

    log.set({ net_id: userData.net_id });

    // 2. Find Applicant ID from applicants table using NetID
    const { data: applicantData, error: applicantError } = await supabase
      .from("applicants")
      .select("id")
      .eq("net_id", userData.net_id)
      .single();

    if (applicantError || !applicantData) {
      log.flush(200);
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

    log.set({ application_count: applications?.length ?? 0 });
    log.flush(200);
    return NextResponse.json(applications);
  } catch (error) {
    log.error("unexpected error fetching user applications", error);
    log.flush(500);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
