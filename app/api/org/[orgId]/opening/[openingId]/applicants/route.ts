import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string; openingId: string }> },
) {
  const { openingId } = await params;
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

  return NextResponse.json({ applicants: existingApplicants });
}
