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
      users:applicant_id (
        net_id,
        name
      )
    `,
    )
    .eq("opening_id", openingId);

  if (error) {
    log.error("Error fetching applicants", error);
    log.flush(500);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const existingApplicants = applications
    .filter((app) => app.users)
    .map((app) => {
      const user = Array.isArray(app.users) ? app.users[0] : app.users;
      return {
        netId: user.net_id,
        applicantId: app.applicant_id,
        name: user.name,
      };
    });

  log.set({ applicant_count: existingApplicants.length });
  log.flush(200);
  return NextResponse.json({ applicants: existingApplicants });
}
