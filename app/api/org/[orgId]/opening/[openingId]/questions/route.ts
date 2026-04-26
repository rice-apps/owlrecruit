import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logger";

type Params = Promise<{ orgId: string; openingId: string }>;

export async function GET(_request: Request, { params }: { params: Params }) {
  const { orgId, openingId } = await params;
  const log = createRequestLogger({
    method: "GET",
    path: `/api/org/${orgId}/opening/${openingId}/questions`,
    org_id: orgId,
    opening_id: openingId,
  });

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("opening_id", openingId)
    .order("sort_order", { ascending: true });

  if (error) {
    log.error("Error fetching questions", error);
    log.flush(500);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  log.set({ question_count: data?.length ?? 0 });
  log.flush(200);
  return NextResponse.json({ questions: data });
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { orgId, openingId } = await params;
  const log = createRequestLogger({
    method: "PATCH",
    path: `/api/org/${orgId}/opening/${openingId}/questions`,
    org_id: orgId,
    opening_id: openingId,
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
      { error: "Only admins can manage questions" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const questions: Array<{
    question_text: string;
    is_required: boolean | null;
    sort_order: number;
  }> = body.questions;

  if (!Array.isArray(questions)) {
    log.flush(400);
    return NextResponse.json(
      { error: "questions must be an array" },
      { status: 400 },
    );
  }

  // Verify the opening belongs to this org before touching its questions
  const { data: opening, error: openingError } = await supabase
    .from("openings")
    .select("id")
    .eq("id", openingId)
    .eq("org_id", orgId)
    .single();

  if (openingError || !opening) {
    log.flush(404);
    return NextResponse.json(
      { error: "Opening not found in this organization" },
      { status: 404 },
    );
  }

  // Delete existing questions first
  const { error: deleteError } = await supabase
    .from("questions")
    .delete()
    .eq("opening_id", openingId);

  if (deleteError) {
    log.error("Error deleting existing questions", deleteError);
    log.flush(500);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (questions.length === 0) {
    log.set({ question_count: 0 });
    log.flush(200);
    return NextResponse.json({ questions: [] });
  }

  const records = questions.map((q, i) => ({
    opening_id: openingId,
    question_text: q.question_text,
    is_required: q.is_required ?? null,
    sort_order: i,
  }));

  const { data, error } = await supabase
    .from("questions")
    .insert(records)
    .select();

  if (error) {
    log.error("Error inserting questions", error);
    log.flush(500);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  log.set({ question_count: data?.length ?? 0 });
  log.flush(200);
  return NextResponse.json({ questions: data });
}
