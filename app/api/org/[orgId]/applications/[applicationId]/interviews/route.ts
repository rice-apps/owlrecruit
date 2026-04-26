import { createClient } from "@/lib/supabase/server";
import { type NextRequest } from "next/server";
import { ok, err } from "@/lib/api-response";
import { requireOrgMember } from "@/lib/auth";
import { createRequestLogger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string; applicationId: string }> },
) {
  const { orgId, applicationId } = await params;
  const log = createRequestLogger({
    method: "GET",
    path: `/api/org/${orgId}/applications/${applicationId}/interviews`,
    org_id: orgId,
    application_id: applicationId,
  });
  try {
    const supabase = await createClient();

    const { userId } = await requireOrgMember(supabase, orgId);
    log.set({ user_id: userId });

    const { data, error } = await supabase
      .from("interviews")
      .select(
        `
        id,
        interviewer_id,
        form_responses,
        round_number,
        created_at,
        updated_at,
        interviewer:users!interviewer_id(id, name)
      `,
      )
      .eq("application_id", applicationId)
      .order("created_at", { ascending: true });

    if (error) {
      log.error("error fetching interviews", error);
      log.flush(500);
      return err(error.message, 500);
    }

    log.set({ interview_count: data?.length ?? 0 });
    log.flush(200);
    return ok(data);
  } catch (e) {
    if (e instanceof Response) return e;
    log.error("unexpected error fetching interviews", e);
    log.flush(500);
    return err("Internal Server Error", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; applicationId: string }> },
) {
  const { orgId, applicationId } = await params;
  const log = createRequestLogger({
    method: "POST",
    path: `/api/org/${orgId}/applications/${applicationId}/interviews`,
    org_id: orgId,
    application_id: applicationId,
  });
  try {
    const supabase = await createClient();

    const { userId } = await requireOrgMember(supabase, orgId);
    log.set({ user_id: userId });

    // Verify application belongs to this org
    const { data: application } = await supabase
      .from("applications")
      .select("id, openings!inner(org_id)")
      .eq("id", applicationId)
      .single();

    if (!application) {
      log.flush(404);
      return err("Application not found", 404);
    }

    const opening = application.openings as
      | { org_id: string }
      | { org_id: string }[];
    const appOrgId = Array.isArray(opening)
      ? opening[0]?.org_id
      : opening.org_id;
    if (appOrgId !== orgId) {
      log.flush(400);
      return err("Application does not belong to this organization");
    }

    // Each interviewer can only have one record per application; block duplicates
    const { data: existing } = await supabase
      .from("interviews")
      .select("id")
      .eq("application_id", applicationId)
      .eq("interviewer_id", userId)
      .maybeSingle();

    if (existing) {
      log.flush(409);
      return err(
        "You already have an interview record for this applicant. Update it instead.",
        409,
      );
    }

    let body: {
      form_responses?: Array<{ question: string; answer: string }>;
      round_number?: number;
    } = {};
    try {
      body = await request.json();
    } catch {
      // body is optional on creation
    }

    const { data, error } = await supabase
      .from("interviews")
      .insert({
        application_id: applicationId,
        interviewer_id: userId,
        form_responses: body.form_responses ?? [],
        round_number: body.round_number ?? 1,
      })
      .select()
      .single();

    if (error) {
      log.error("error creating interview", error);
      log.flush(500);
      return err(error.message, 500);
    }

    log.set({ interview_id: data.id });
    log.flush(201);
    return ok(data, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    log.error("unexpected error creating interview", e);
    log.flush(500);
    return err("Internal Server Error", 500);
  }
}
