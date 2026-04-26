import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const log = createRequestLogger({
    method: "GET",
    path: `/api/org/${orgId}/openings`,
    org_id: orgId,
  });

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
      rubric
    `,
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    log.error("error fetching org openings", error);
    log.flush(500);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const openings = data.map((opening) => {
    const rubric =
      (opening.rubric as unknown as Array<{ name: string; max_val: number }>) ??
      [];

    return {
      id: opening.id,
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

  log.set({ result_count: openings.length });
  log.flush(200);
  return NextResponse.json(openings);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const log = createRequestLogger({
    method: "POST",
    path: `/api/org/${orgId}/openings`,
    org_id: orgId,
  });

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    log.flush(401);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  log.set({ user_id: user.id });

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .single();

  if (membership?.role !== "admin") {
    log.flush(403);
    return NextResponse.json(
      { error: "Only admins can create openings" },
      { status: 403 },
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

  if (!title?.trim()) {
    log.flush(400);
    return NextResponse.json(
      { error: "Position title is required" },
      { status: 400 },
    );
  }

  if (reviewer_ids !== undefined && !Array.isArray(reviewer_ids)) {
    log.flush(400);
    return NextResponse.json(
      { error: "reviewer_ids must be an array of user IDs" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("openings")
    .insert({
      org_id: orgId,
      title: title.trim(),
      description: description?.trim() || null,
      application_link: application_link?.trim() || null,
      closes_at: closes_at || null,
      status: status || "open",
      reviewer_ids:
        reviewer_ids === undefined
          ? null
          : Array.from(
              new Set(
                reviewer_ids
                  .filter((id: unknown) => typeof id === "string")
                  .map((id: string) => id.trim())
                  .filter(Boolean),
              ),
            ),
      rubric: rubric ?? null,
    })
    .select()
    .single();

  if (error) {
    log.error("error creating opening", error);
    log.flush(500);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  log.set({ opening_id: data.id });
  log.flush(201);
  return NextResponse.json(data, { status: 201 });
}
