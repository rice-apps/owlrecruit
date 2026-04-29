import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logger";

type Params = Promise<{ openingId: string }>;

/** Public endpoint — returns opening metadata + questions for the apply page. */
export async function GET(_request: Request, { params }: { params: Params }) {
  const { openingId } = await params;
  const log = createRequestLogger({
    method: "GET",
    path: `/api/openings/${openingId}`,
    opening_id: openingId,
  });

  const supabase = await createClient();

  const { data: opening, error: openingError } = await supabase
    .from("openings")
    .select("id, title, description, status, closes_at, orgs(name)")
    .eq("id", openingId)
    .single();

  if (openingError || !opening) {
    log.flush(404);
    return NextResponse.json({ error: "Opening not found" }, { status: 404 });
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_text, is_required, sort_order")
    .eq("opening_id", openingId)
    .order("sort_order", { ascending: true });

  log.set({ question_count: questions?.length ?? 0 });
  log.flush(200);
  return NextResponse.json({ opening, questions: questions ?? [] });
}
