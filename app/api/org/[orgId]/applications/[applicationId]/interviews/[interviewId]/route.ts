import { createClient } from "@/lib/supabase/server";
import { type NextRequest } from "next/server";
import { ok, err } from "@/lib/api-response";
import { requireOrgMember } from "@/lib/auth";
import { createRequestLogger } from "@/lib/logger";

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      orgId: string;
      applicationId: string;
      interviewId: string;
    }>;
  },
) {
  const { orgId, applicationId, interviewId } = await params;
  const log = createRequestLogger({
    method: "PATCH",
    path: `/api/org/${orgId}/applications/${applicationId}/interviews/${interviewId}`,
    org_id: orgId,
    application_id: applicationId,
    interview_id: interviewId,
  });
  try {
    const supabase = await createClient();

    const { userId, role } = await requireOrgMember(supabase, orgId);
    log.set({ user_id: userId, role });

    // Fetch the interview record to verify ownership
    const { data: interview, error: fetchError } = await supabase
      .from("interviews")
      .select("id, interviewer_id, application_id")
      .eq("id", interviewId)
      .eq("application_id", applicationId)
      .single();

    if (fetchError || !interview) {
      log.flush(404);
      return err("Interview record not found", 404);
    }

    // Only the interviewer who created the record (or an admin) can update it
    if (interview.interviewer_id !== userId && role !== "admin") {
      log.flush(403);
      return err("You can only edit your own interview records", 403);
    }

    let body: { form_responses?: Array<{ question: string; answer: string }> };
    try {
      body = await request.json();
    } catch {
      log.flush(400);
      return err("Invalid JSON body");
    }

    if (!Array.isArray(body.form_responses)) {
      log.flush(400);
      return err("form_responses must be an array");
    }

    const { data, error } = await supabase
      .from("interviews")
      .update({
        form_responses: body.form_responses,
        updated_at: new Date().toISOString(),
      })
      .eq("id", interviewId)
      .select()
      .single();

    if (error) {
      log.error("Error updating interview", error);
      log.flush(500);
      return err(error.message, 500);
    }

    log.flush(200);
    return ok(data);
  } catch (e) {
    if (e instanceof Response) return e;
    log.error("Unexpected error updating interview", e);
    log.flush(500);
    return err("Internal Server Error", 500);
  }
}
