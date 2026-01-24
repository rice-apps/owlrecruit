import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";
import { Constants } from "@/types/supabase";

const VALID_SCORES = Constants.public.Enums.score;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  try {
    // Extract applicationId from route params
    const { applicationId } = await params;

    // Parse JSON body
    let body: { score?: string; notes?: string };
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
      });
    }

    // Validate at least one of score/notes is provided
    if (!body.score && !body.notes) {
      return new Response(
        JSON.stringify({
          error: "At least one of score or notes must be provided",
        }),
        { status: 400 },
      );
    }

    // Validate score against enum if provided
    if (body.score && !VALID_SCORES.includes(body.score as any)) {
      return new Response(
        JSON.stringify({
          error: `Invalid score. Must be one of: ${VALID_SCORES.join(", ")}`,
        }),
        { status: 400 },
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Verify application exists and get opening_id
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, opening_id, openings!inner(org_id)")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return new Response(JSON.stringify({ error: "Application not found" }), {
        status: 404,
      });
    }

    // Get org_id from opening
    const orgId = (application.openings as any).org_id;

    // Verify user is org member
    const { data: membership, error: memberError } = await supabase
      .from("org_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .single();

    if (memberError || !membership) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    // Check for existing review
    const { data: existingReview, error: checkError } = await supabase
      .from("application_reviews")
      .select("id")
      .eq("application_id", applicationId)
      .eq("reviewer_id", user.id)
      .single();

    if (existingReview) {
      return new Response(
        JSON.stringify({ error: "Review already exists for this application" }),
        { status: 409 },
      );
    }

    // Insert review with reviewer_id = user.id
    const { data: review, error: insertError } = await supabase
      .from("application_reviews")
      .insert({
        application_id: applicationId,
        reviewer_id: user.id,
        score: body.score || null,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
      });
    }

    // Return 201 with created review
    return new Response(JSON.stringify(review), { status: 201 });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500 },
    );
  }
}
