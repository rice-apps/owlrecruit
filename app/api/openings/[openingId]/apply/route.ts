import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { ensureApplicant } from "@/lib/csv-upload-utils";
import { parseQuestionText } from "@/lib/question-utils";
import { createRequestLogger } from "@/lib/logger";

type Params = Promise<{ openingId: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  const { openingId } = await params;
  const log = createRequestLogger({
    method: "POST",
    path: `/api/openings/${openingId}/apply`,
    opening_id: openingId,
  });

  const supabase = await createClient();

  // Auth required
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    log.flush(401);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  log.set({ user_id: user.id });

  const email = user.email ?? "";
  if (!email.endsWith("@rice.edu")) {
    log.flush(400);
    return NextResponse.json(
      { error: "A Rice University email (@rice.edu) is required to apply." },
      { status: 400 },
    );
  }

  const netId = email.split("@")[0];
  const name: string =
    (user.user_metadata?.full_name as string | undefined) || netId;

  log.set({ net_id: netId });

  // Verify opening is accepting applications
  const { data: opening, error: openingError } = await supabase
    .from("openings")
    .select("id, status")
    .eq("id", openingId)
    .single();

  if (openingError || !opening) {
    log.flush(404);
    return NextResponse.json({ error: "Opening not found" }, { status: 404 });
  }

  if (opening.status !== "open") {
    log.set({ opening_status: opening.status });
    log.flush(409);
    return NextResponse.json(
      { error: "This opening is not currently accepting applications." },
      { status: 409 },
    );
  }

  // Find or create applicant record
  const applicant = await ensureApplicant(supabase, netId, name);
  log.set({ applicant_id: applicant.id });

  // Duplicate check
  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("opening_id", openingId)
    .eq("applicant_id", applicant.id)
    .maybeSingle();

  if (existing) {
    log.flush(409);
    return NextResponse.json(
      { error: "You have already submitted an application for this opening." },
      { status: 409 },
    );
  }

  // Validate required questions
  const body = await request.json();
  const formResponses: Record<string, string | string[]> =
    body.form_responses ?? {};

  const { data: questions } = await supabase
    .from("questions")
    .select("question_text, is_required")
    .eq("opening_id", openingId);

  for (const q of questions ?? []) {
    if (!q.is_required) continue;
    const { label } = parseQuestionText(q.question_text);
    const answer = formResponses[label];
    const isEmpty =
      answer === undefined ||
      answer === null ||
      answer === "" ||
      (Array.isArray(answer) && answer.length === 0);
    if (isEmpty) {
      log.flush(400);
      return NextResponse.json(
        { error: `Required field is missing: ${label}` },
        { status: 400 },
      );
    }
  }

  // Insert application — always include name and netid in form_responses
  const enrichedResponses = {
    name,
    netid: netId,
    ...formResponses,
  };

  const { error: insertError } = await supabase.from("applications").insert({
    opening_id: openingId,
    applicant_id: applicant.id,
    user_id: user.id,
    form_responses: enrichedResponses,
    status: "Applied",
  });

  if (insertError) {
    if (
      insertError.code === "23505" ||
      insertError.message.includes("duplicate key")
    ) {
      log.flush(409);
      return NextResponse.json(
        {
          error: "You have already submitted an application for this opening.",
        },
        { status: 409 },
      );
    }
    log.error("application insert error", insertError);
    log.flush(500);
    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while submitting your application.",
      },
      { status: 500 },
    );
  }

  log.flush(201);
  return NextResponse.json({ success: true }, { status: 201 });
}
