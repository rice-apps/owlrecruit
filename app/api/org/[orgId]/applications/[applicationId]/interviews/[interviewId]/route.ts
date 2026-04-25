import { createClient } from "@/lib/supabase/server";
import { type NextRequest } from "next/server";
import { ok, err } from "@/lib/api-response";
import { requireOrgMember } from "@/lib/auth";

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
  try {
    const { orgId, applicationId, interviewId } = await params;
    const supabase = await createClient();

    const { userId, role } = await requireOrgMember(supabase, orgId);

    // Fetch the interview record to verify ownership
    const { data: interview, error: fetchError } = await supabase
      .from("interviews")
      .select("id, interviewer_id, application_id")
      .eq("id", interviewId)
      .eq("application_id", applicationId)
      .single();

    if (fetchError || !interview) return err("Interview record not found", 404);

    // Only the interviewer who created the record (or an admin) can update it
    if (interview.interviewer_id !== userId && role !== "admin") {
      return err("You can only edit your own interview records", 403);
    }

    let body: { form_responses?: Array<{ question: string; answer: string }> };
    try {
      body = await request.json();
    } catch {
      return err("Invalid JSON body");
    }

    if (!Array.isArray(body.form_responses)) {
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

    if (error) return err(error.message, 500);
    return ok(data);
  } catch (e) {
    if (e instanceof Response) return e;
    return err("Internal Server Error", 500);
  }
}
