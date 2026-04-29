import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ok, err } from "@/lib/api-response";
import { requireOrgMember } from "@/lib/auth";
import { APPLICATION_STATUS_LIST } from "@/lib/status";
import { createRequestLogger } from "@/lib/logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; applicationId: string }> },
) {
  const { orgId, applicationId } = await params;
  const log = createRequestLogger({
    method: "PATCH",
    path: `/api/org/${orgId}/applications/${applicationId}`,
    org_id: orgId,
    application_id: applicationId,
  });
  try {
    const supabase = await createClient();

    const { userId } = await requireOrgMember(supabase, orgId);
    log.set({ user_id: userId });

    const body = await request.json();
    const { status } = body;
    log.set({ new_status: status });

    if (!status || !APPLICATION_STATUS_LIST.includes(status)) {
      log.flush(400);
      return err("Invalid status value");
    }

    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, openings!inner(org_id)")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      log.flush(404);
      return err("Application not found", 404);
    }

    const appOrgId = (
      application.openings as unknown as { org_id: string } | null
    )?.org_id;

    if (appOrgId !== orgId) {
      log.flush(400);
      return err("Application does not belong to this organization");
    }

    const { data: updated, error: updateError } = await supabase
      .from("applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", applicationId)
      .select()
      .single();

    if (updateError) {
      log.error("error updating application status", updateError);
      log.flush(500);
      return err(updateError.message, 500);
    }

    log.flush(200);
    return ok(updated);
  } catch (e) {
    if (e instanceof Response) return e;
    log.error("unexpected error updating application", e);
    log.flush(500);
    return err("Internal Server Error", 500);
  }
}
