import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Params = Promise<{ orgId: string; openingId: string }>;

export async function GET(_request: Request, { params }: { params: Params }) {
  const { openingId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("opening_id", openingId)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ questions: data });
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { orgId, openingId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .single();

  if (membership?.role !== "admin") {
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
    return NextResponse.json(
      { error: "questions must be an array" },
      { status: 400 },
    );
  }

  // Delete existing and reinsert — same pattern as CSV upload
  const { error: deleteError } = await supabase
    .from("questions")
    .delete()
    .eq("opening_id", openingId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (questions.length === 0) {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ questions: data });
}
