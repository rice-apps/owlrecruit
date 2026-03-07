import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = [
  "No Status",
  "Applied",
  "Interviewing",
  "Offer",
  "Accepted Offer",
  "Rejected",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; applicationId: string }> },
) {
  const { orgId, applicationId } = await params;
  const supabase = await createClient();

  const body = await request.json();
  const { status } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "Invalid status value" },
      { status: 400 },
    );
  }

  const { data: application, error: appError } = await supabase
    .from("applications")
    .select("*, openings!inner(org_id)")
    .eq("id", applicationId)
    .single();

  if (appError || !application) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 },
    );
  }

  const appOrgId = Array.isArray(application.openings)
    ? application.openings[0]?.org_id
    : application.openings.org_id;

  if (appOrgId !== orgId) {
    return NextResponse.json(
      { error: "Application does not belong to this organization" },
      { status: 400 },
    );
  }

  const { data: updatedApp, error: updateError } = await supabase
    .from("applications")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ data: updatedApp });
}
