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

    const userId = user.id;

    // Fetch org memberships and applications in parallel
    const [membershipsResult, applicationsResult] = await Promise.all([
      supabase
        .from("org_members")
        .select("org_id, role, created_at")
        .eq("user_id", userId),
      supabase
        .from("applications")
        .select(
          `
          id,
          opening_id,
          status,
          created_at,
          openings!inner (
            org_id,
            title,
            closes_at
          )
        `,
        )
        .eq("applicant_id", userId)
        .neq("status", "Rejected"),
    ]);

    if (membershipsResult.error) {
      throw new Error(membershipsResult.error.message);
    }
    if (applicationsResult.error) {
      throw new Error(applicationsResult.error.message);
    }

    const memberships = membershipsResult.data;
    const applications = applicationsResult.data;

    // Extract unique org IDs to fetch org names
    const orgIds = new Set([
      ...(memberships?.map((m) => m.org_id) || []),
      ...(applications
        ?.map((a) => {
          const opening = Array.isArray(a.openings)
            ? a.openings[0]
            : a.openings;
          return opening?.org_id;
        })
        .filter(Boolean) || []),
    ]);

    // Fetch organization names
    const orgsResult =
      orgIds.size > 0
        ? await supabase
          .from("orgs")
          .select("id, name")
          .in("id", Array.from(orgIds))
        : { data: [], error: null };

    if (orgsResult.error) {
      throw new Error(orgsResult.error.message);
    }

    // Create lookup map for org names
    const orgMap = new Map(
      orgsResult.data?.map((org) => [org.id, org.name]) || [],
    );

    // Transform memberships
    const transformedMemberships =
      memberships?.map((membership) => ({
        org_id: membership.org_id,
        role: membership.role,
        created_at: membership.created_at,
        org_name: orgMap.get(membership.org_id) || "Unknown Organization",
      })) || [];

    // Transform applications
    const transformedApplications =
      applications?.map((application) => {
        const opening = Array.isArray(application.openings)
          ? application.openings[0]
          : application.openings;
        return {
          org_id: opening?.org_id || "",
          opening_id: application.opening_id,
          status: application.status,
          created_at: application.created_at,
          opening_title: opening?.title || "Unknown Position",
          org_name: orgMap.get(opening?.org_id || "") || "Unknown Organization",
          closes_at: opening?.closes_at || null,
        };
      }) || [];

    return NextResponse.json({
      memberships: transformedMemberships,
      applications: transformedApplications,
    });
  } catch (error) {
    console.error("Error fetching user org status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
