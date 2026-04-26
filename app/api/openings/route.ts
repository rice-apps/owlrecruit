import { createClient } from "@/lib/supabase/server";
import { createRequestLogger } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const log = createRequestLogger({ method: "GET", path: "/api/openings" });
  try {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();

    const statuses = searchParams.get("statuses")?.split(",") || ["open"];
    const datePosted = searchParams.get("datePosted") || "all";
    const deadline = searchParams.get("deadline") || "all";
    const sort = searchParams.get("sort") || "recent";

    log.set({ statuses, date_posted: datePosted, deadline, sort });

    let query = supabase.from("openings").select(
      `
        *,
        org:orgs(name, logo_url)
      `,
    );

    // Filter by status(es)
    if (statuses.length === 1) {
      query = query.eq("status", statuses[0]);
    } else {
      query = query.in("status", statuses);
    }

    // Filter by date posted
    if (datePosted !== "all") {
      const cutoffDate = new Date();
      if (datePosted === "7days") {
        cutoffDate.setDate(cutoffDate.getDate() - 7);
      } else if (datePosted === "30days") {
        cutoffDate.setDate(cutoffDate.getDate() - 30);
      }
      query = query.gte("created_at", cutoffDate.toISOString());
    }

    // Filter by application deadline
    if (deadline === "closing-soon") {
      const now = new Date();
      const sevenDaysFromNow = new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000,
      );
      query = query.gte("closes_at", now.toISOString());
      query = query.lte("closes_at", sevenDaysFromNow.toISOString());
    } else if (deadline === "no-deadline") {
      query = query.is("closes_at", null);
    }

    // Apply ordering based on sort parameter
    if (sort === "recent") {
      query = query.order("created_at", { ascending: false });
    } else if (sort === "closing-soon") {
      query = query.order("closes_at", { ascending: true, nullsFirst: false });
    } else if (sort === "org-name") {
      query = query.order("name", { referencedTable: "orgs", ascending: true });
    }

    const { data: openings, error: fetchError } = await query;

    if (fetchError) {
      log.error("error fetching openings", fetchError);
      log.flush(500);
      return NextResponse.json(
        { error: "Failed to fetch openings" },
        { status: 500 },
      );
    }

    // Attach the current user's application status to each opening (if logged in)
    let applicationStatusMap: Record<string, string> = {};
    const { data: authData } = await supabase.auth.getClaims();
    if (authData?.claims && openings && openings.length > 0) {
      log.set({ user_id: authData.claims.sub });
      const openingIds = openings.map((o) => o.id);
      const { data: userApplications } = await supabase
        .from("applications")
        .select("opening_id, status")
        .eq("user_id", authData.claims.sub)
        .in("opening_id", openingIds);

      if (userApplications) {
        applicationStatusMap = Object.fromEntries(
          userApplications.map((a) => [a.opening_id, a.status]),
        );
      }
    }

    const enriched = (openings ?? []).map((o) => ({
      ...o,
      applicationStatus: applicationStatusMap[o.id] ?? null,
    }));

    log.set({ result_count: enriched.length });
    log.flush(200);
    return NextResponse.json(enriched);
  } catch (error) {
    log.error("unexpected error in openings GET", error);
    log.flush(500);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const log = createRequestLogger({ method: "POST", path: "/api/openings" });
  try {
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      log.flush(401);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = authData.user;
    log.set({ user_id: user.id });

    const body = await request.json();
    const { org_id, title, description, application_link, closes_at, status } =
      body;
    log.set({ org_id });

    if (!title?.trim()) {
      log.flush(400);
      return NextResponse.json(
        { error: "Position title is required" },
        { status: 400 },
      );
    }

    // Verify user has permission to create opening in this org
    const { data: membership, error: membershipError } = await supabase
      .from("org_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("org_id", org_id)
      .single();

    if (membershipError || !membership || membership.role !== "admin") {
      log.flush(403);
      return NextResponse.json(
        { error: "Unauthorized: Only admins can manage openings" },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("openings")
      .insert({
        org_id,
        title: title.trim(),
        description: description?.trim() || null,
        application_link: application_link?.trim() || null,
        closes_at: closes_at || null,
        status: status || "open",
      })
      .select()
      .single();

    if (error) {
      log.error("error inserting opening", error);
      log.flush(500);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    log.set({ opening_id: data.id });
    log.flush(200);
    return NextResponse.json(data);
  } catch (error) {
    log.error("unexpected error in openings POST", error);
    log.flush(500);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
