/**
 * PATCH /api/applications/:applicationId
 * 
 * Updates an application's status. Requires user to be an admin or reviewer of the organization.
 * Body: { status: "No Status" | "Applied" | "Interviewing" | "Offer" | "Accepted Offer" | "Rejected" }
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatErrorResponse } from "@/lib/csv-upload-utils";

const VALID_STATUSES = ["No Status", "Applied", "Interviewing", "Offer", "Accepted Offer", "Rejected"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify(formatErrorResponse("Unauthorized")),
        { status: 401 }
      );
    }

    // Get applicationId from params
    const { applicationId } = await params;

    // Parse request body
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !VALID_STATUSES.includes(status)) {
      return new Response(
        JSON.stringify(formatErrorResponse("Invalid status value")),
        { status: 400 }
      );
    }

    // Fetch application with opening data to get org_id
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("*, openings!inner(org_id)")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return new Response(
        JSON.stringify(formatErrorResponse("Application not found")),
        { status: 404 }
      );
    }

    // Check if user has permission (admin or reviewer of the org)
    const orgId = Array.isArray(application.openings) 
      ? application.openings[0]?.org_id  // if array, get first case
      : application.openings.org_id;     // otherwise, direct access
      
    const { data: membership } = await supabase
      .from("org_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .single();

    if (!membership || !["admin", "reviewer"].includes(membership.role)) {
      return new Response(
        JSON.stringify(formatErrorResponse("You do not have permission to update this application")),
        { status: 403 }
      );
    }

    // Update application
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
      return new Response(
        JSON.stringify(formatErrorResponse(updateError.message)),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ data: updatedApp }),
      { status: 200 }
    );

  } catch (err) {
    return new Response(
      JSON.stringify(formatErrorResponse(err instanceof Error ? err.message : "Unknown error")),
      { status: 500 }
    );
  } 
}