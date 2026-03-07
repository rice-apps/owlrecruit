import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; openingId: string }> },
) {
  const { orgId, openingId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user!.id)
    .eq("org_id", orgId)
    .single();

  if (membership?.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can update openings" },
      { status: 403 },
    );
  }

  const { data: opening } = await supabase
    .from("openings")
    .select("org_id")
    .eq("id", openingId)
    .single();

  if (!opening) {
    return NextResponse.json({ error: "Opening not found" }, { status: 404 });
  }

  if (opening.org_id !== orgId) {
    return NextResponse.json(
      { error: "Opening does not belong to this organization" },
      { status: 400 },
    );
  }

  const body = await request.json();
  const { title, description, application_link, closes_at, status, rubric } =
    body;

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined)
    updates.description = description?.trim() || null;
  if (application_link !== undefined)
    updates.application_link = application_link?.trim() || null;
  if (closes_at !== undefined) updates.closes_at = closes_at || null;
  if (status !== undefined) updates.status = status;
  if (rubric !== undefined) updates.rubric = rubric;

  const { error: updateError } = await supabase
    .from("openings")
    .update(updates)
    .eq("id", openingId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
