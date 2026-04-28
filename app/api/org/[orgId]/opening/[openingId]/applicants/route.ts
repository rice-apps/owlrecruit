import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string; openingId: string }> },
) {
  const { orgId, openingId } = await params;
  const log = createRequestLogger({
    method: "GET",
    path: `/api/org/${orgId}/opening/${openingId}/applicants`,
    org_id: orgId,
    opening_id: openingId,
  });

  const supabase = await createClient();

  const { data: applications, error } = await supabase
    .from("applications")
    .select(
      `
      applicant_id,
      applicant:applicant_id (
        net_id,
        name
      )
    `,
    )
    .eq("opening_id", openingId);

  if (error) {
    log.error("error fetching applicants", error);
    log.flush(500);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const existingApplicants = applications
    .filter((app) => app.applicant)
    .map((app) => {
      const applicant = Array.isArray(app.applicant)
        ? app.applicant[0]
        : app.applicant;
      return {
        netId: applicant.net_id,
        applicantId: app.applicant_id,
        name: applicant.name,
      };
    });

  log.set({ applicant_count: existingApplicants.length });
  log.flush(200);
  return NextResponse.json({ applicants: existingApplicants });
}
