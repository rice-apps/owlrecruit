import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logger";

async function requireAdminForOrg(orgId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      supabase: null,
      userId: null,
    };
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .single();

  if (membership?.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Only admins can access opening configuration" },
        { status: 403 },
      ),
      supabase: null,
      userId: null,
    };
  }

  return { error: null, supabase, userId: user.id };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; openingId: string }> },
) {
  const { orgId, openingId } = await params;
  const log = createRequestLogger({
    method: "GET",
    path: `/api/org/${orgId}/openings/${openingId}`,
    org_id: orgId,
    opening_id: openingId,
  });

  const { error, supabase, userId } = await requireAdminForOrg(orgId);
  if (error || !supabase) {
    log.flush(error ? (error.status ?? 403) : 403);
    return error;
  }
  log.set({ user_id: userId });

  const { data: openingData } = await supabase
    .from("openings")
    .select(
      "id, title, description, application_link, status, closes_at, rubric",
    )
    .eq("id", openingId)
    .eq("org_id", orgId)
    .single();

  if (!openingData) {
    log.flush(404);
    return NextResponse.json({ error: "Opening not found" }, { status: 404 });
  }

  log.flush(200);
  return NextResponse.json({
    opening: {
      title: openingData.title || "",
      description: openingData.description || "",
      application_link: openingData.application_link || "",
      closes_at: openingData.closes_at || "",
      status: openingData.status || "draft",
      rubric: Array.isArray(openingData.rubric)
        ? openingData.rubric.map((item) => ({
            name: item?.name || "",
            max_val: item?.max_val || 10,
            description: item?.description || "",
          }))
        : [],
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; openingId: string }> },
) {
  const { orgId, openingId } = await params;
  const log = createRequestLogger({
    method: "PATCH",
    path: `/api/org/${orgId}/openings/${openingId}`,
    org_id: orgId,
    opening_id: openingId,
  });

  const { error, supabase, userId } = await requireAdminForOrg(orgId);
  if (error || !supabase) {
    log.flush(error ? (error.status ?? 403) : 403);
    return error;
  }
  log.set({ user_id: userId });

  const { data: opening } = await supabase
    .from("openings")
    .select("org_id")
    .eq("id", openingId)
    .single();

  if (!opening) {
    log.flush(404);
    return NextResponse.json({ error: "Opening not found" }, { status: 404 });
  }

  if (opening.org_id !== orgId) {
    log.flush(400);
    return NextResponse.json(
      { error: "Opening does not belong to this organization" },
      { status: 400 },
    );
  }

  const body = await request.json();
  const {
    title,
    description,
    application_link,
    closes_at,
    status,
    rubric,
    reviewer_ids,
  } = body;

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined)
    updates.description = description?.trim() || null;
  if (application_link !== undefined)
    updates.application_link = application_link?.trim() || null;
  if (closes_at !== undefined) updates.closes_at = closes_at || null;
  if (status !== undefined) updates.status = status;
  if (rubric !== undefined) updates.rubric = rubric;
  if (reviewer_ids !== undefined) {
    if (!Array.isArray(reviewer_ids)) {
      log.flush(400);
      return NextResponse.json(
        { error: "reviewer_ids must be an array of user IDs" },
        { status: 400 },
      );
    }

    updates.reviewer_ids = Array.from(
      new Set(
        reviewer_ids
          .filter((id: unknown) => typeof id === "string")
          .map((id: string) => id.trim())
          .filter(Boolean),
      ),
    );
  }

  const { error: updateError } = await supabase
    .from("openings")
    .update(updates)
    .eq("id", openingId);

  if (updateError) {
    log.error("error updating opening", updateError);
    log.flush(500);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  log.set({ updated_fields: Object.keys(updates) });
  log.flush(200);
  return NextResponse.json({ success: true });
}
