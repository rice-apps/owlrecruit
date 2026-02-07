import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
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

  return NextResponse.json(openings);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
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
      { error: "Only admins can create openings" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { title, description, application_link, closes_at, status } = body;

  if (!title?.trim()) {
    return NextResponse.json(
      { error: "Position title is required" },
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
      status: status || "draft",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
