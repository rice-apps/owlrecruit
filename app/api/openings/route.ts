import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("openings")
      .select(
        `
        id,
        title,
        description,
        application_link,
        status,
        closes_at,
        orgs (
          name
        ),
        rubric
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to flatten org name
    const openings = data.map((opening) => {
      // Supabase returns nested relation as object for FK, but TS infers as array
      const org = Array.isArray(opening.orgs) ? opening.orgs[0] : opening.orgs;
      const rubric =
        (opening.rubric as any as Array<{ name: string; max_val: number }>) ??
        [];

      return {
        id: opening.id,
        org_name: org?.name ?? null,
        title: opening.title,
        description: opening.description,
        application_link: opening.application_link,
        status: opening.status,
        closes_at: opening.closes_at,
        rubrics: rubric.map((r) => ({
          name: r.name,
          max_val: r.max_val,
        })),
      };
    });

    return NextResponse.json(openings);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating opening:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
