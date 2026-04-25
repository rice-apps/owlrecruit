import { createClient } from "@/lib/supabase/server";
import { type NextRequest } from "next/server";
import { ok, err } from "@/lib/api-response";
import { requireOrgMember } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string; applicationId: string }> },
) {
  try {
    const { orgId, applicationId } = await params;
    const supabase = await createClient();

    await requireOrgMember(supabase, orgId);

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

    if (error) return err(error.message, 500);
    return ok(data);
  } catch (e) {
    if (e instanceof Response) return e;
    return err("Internal Server Error", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; applicationId: string }> },
) {
  try {
    const { orgId, applicationId } = await params;
    const supabase = await createClient();

    const { userId } = await requireOrgMember(supabase, orgId);

    // Verify application belongs to this org
    const { data: application } = await supabase
      .from("applications")
      .select("id, openings!inner(org_id)")
      .eq("id", applicationId)
      .single();

    if (!application) return err("Application not found", 404);

    const opening = application.openings as
      | { org_id: string }
      | { org_id: string }[];
    const appOrgId = Array.isArray(opening)
      ? opening[0]?.org_id
      : opening.org_id;
    if (appOrgId !== orgId)
      return err("Application does not belong to this organization");

    // Each interviewer can only have one record per application; block duplicates
    const { data: existing } = await supabase
      .from("interviews")
      .select("id")
      .eq("application_id", applicationId)
      .eq("interviewer_id", userId)
      .maybeSingle();

    if (existing)
      return err(
        "You already have an interview record for this applicant. Update it instead.",
        409,
      );

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

    if (error) return err(error.message, 500);
    return ok(data, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return err("Internal Server Error", 500);
  }
}
