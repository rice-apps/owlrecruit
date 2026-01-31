import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
    const {
      org_id,
      title,
      description,
      application_link,
      closes_at,
      status,
    } = body;

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
