import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ openingId: string }> },
) {
  try {
    const supabase = await createClient();
    const { openingId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, application_link, closes_at, status, org_id } =
      body;

    // Verify user has permission to update opening in this org
    // We need org_id to verify membership. It should be passed in body or we fetch it.
    // Fetching it is safer.
    const { data: opening, error: openingError } = await supabase
      .from("openings")
      .select("org_id")
      .eq("id", openingId)
      .single();

    if (openingError || !opening) {
      return NextResponse.json({ error: "Opening not found" }, { status: 404 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("org_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("org_id", opening.org_id)
      .single();

    if (membershipError || !membership || membership.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can manage openings" },
        { status: 403 },
      );
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined)
      updates.description = description?.trim() || null;
    if (application_link !== undefined)
      updates.application_link = application_link?.trim() || null;
    if (closes_at !== undefined) updates.closes_at = closes_at || null;
    if (status !== undefined) updates.status = status;

    const { error: updateError } = await supabase
      .from("openings")
      .update(updates)
      .eq("id", openingId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating opening:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
