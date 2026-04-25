import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ok, err } from "@/lib/api-response";
import { requireOrgMember } from "@/lib/auth";
import { APPLICATION_STATUS_LIST } from "@/lib/status";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; applicationId: string }> },
) {
  try {
    const { orgId, applicationId } = await params;
    const supabase = await createClient();

    await requireOrgMember(supabase, orgId);

    const body = await request.json();
    const { status } = body;

    if (!status || !APPLICATION_STATUS_LIST.includes(status)) {
      return err("Invalid status value");
    }

    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, openings!inner(org_id)")
      .eq("id", applicationId)
      .single();

    if (appError || !application) return err("Application not found", 404);

    const opening = application.openings as
      | { org_id: string }
      | { org_id: string }[];
    const appOrgId = Array.isArray(opening)
      ? opening[0]?.org_id
      : opening.org_id;

    if (appOrgId !== orgId)
      return err("Application does not belong to this organization");

    const { data: updated, error: updateError } = await supabase
      .from("applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", applicationId)
      .select()
      .single();

    if (updateError) return err(updateError.message, 500);
    return ok(updated);
  } catch (e) {
    if (e instanceof Response) return e;
    return err("Internal Server Error", 500);
  }
}
