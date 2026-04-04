import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();

    let query = supabase
      .from("openings")
      .select(
        `
        *,
        org:orgs(name)
      `,
      );

    // Filter by status(es)
    const statuses = searchParams.get("statuses")?.split(",") || ["open"];
    if (statuses.length === 1) {
      query = query.eq("status", statuses[0]);
    } else {
      query = query.in("status", statuses);
    }

    // Filter by date posted
    const datePosted = searchParams.get("datePosted") || "all";
    if (datePosted !== "all") {
      const now = new Date();
      let cutoffDate = new Date();
      
      if (datePosted === "7days") {
        cutoffDate.setDate(cutoffDate.getDate() - 7);
      } else if (datePosted === "30days") {
        cutoffDate.setDate(cutoffDate.getDate() - 30);
      }
      
      query = query.gte("created_at", cutoffDate.toISOString());
    }

    // Filter by application deadline
    const deadline = searchParams.get("deadline") || "all";
    if (deadline === "closing-soon") {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      query = query.gte("closes_at", now.toISOString());
      query = query.lte("closes_at", sevenDaysFromNow.toISOString());
    } else if (deadline === "no-deadline") {
      query = query.is("closes_at", null);
    }

    // Apply ordering based on sort parameter
    const sort = searchParams.get("sort") || "recent";
    if (sort === "recent") {
      query = query.order("created_at", { ascending: false });
    } else if (sort === "closing-soon") {
      query = query.order("closes_at", { ascending: true, nullsFirst: false });
    } else if (sort === "org-name") {
      query = query.order("title", { ascending: true });
    }

    const { data: openings, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching openings:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch openings" },
        { status: 500 },
      );
    }

    return NextResponse.json(openings);
  } catch (error) {
    console.error("Error in openings API GET:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = authData.user;

    const body = await request.json();
    const { org_id, title, description, application_link, closes_at, status } =
      body;

    if (!title?.trim()) {
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
        status: status || "draft",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in openings API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
