import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ applicationId: string }> },
) {
  const params = await props.params;
  try {
    const supabase = await createClient();
    const { applicationId } = params;

    const { data: reviews, error } = await supabase
      .from("application_reviews")
      .select(
        `
        id,
        score,
        notes,
        created_at,
        reviewer:users!reviewer_id(name),
        reviewer_id
      `,
      )
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map to comment format expected by sidebar
    const comments = reviews.map((r) => ({
      id: r.id,
      content: r.notes || "",
      createdAt: r.created_at,
      userName: (r.reviewer as any)?.name || "Unknown",
      score: r.score,
      reviewerId: r.reviewer_id,
    }));

    return NextResponse.json(comments);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ applicationId: string }> },
) {
  const params = await props.params;
  try {
    const { applicationId } = params;

    // Parse JSON body
    let body: { score?: number | string; notes?: string; content?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Map content to notes if provided (for compatibility)
    const notes = body.notes || body.content;
    const scoreVal = body.score ? Number(body.score) : undefined;

    // Validate at least one of score/notes is provided
    if (scoreVal === undefined && !notes) {
      return NextResponse.json(
        { error: "At least one of score or notes must be provided" },
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify application exists and get opening_id (for org check)
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, openings!inner(org_id)")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // UPSERT Review
    // We want to merge updates. If a review exists, we update provided fields.
    // However, Supabase upsert requires a complete record or it replaces?
    // Actually, upsert works by Primary Key or Unique Constraint.
    // 'application_reviews' usually doesn't have a unique constraint on (app_id, reviewer_id) unless we added one. 
    // The previous code did a check for existence.
    // Let's check if there is an existing review ID first to be safe and do an UPDATE, or INSERT if not.
    
     const { data: existingReview } = await supabase
      .from("application_reviews")
      .select("id")
      .eq("application_id", applicationId)
      .eq("reviewer_id", user.id)
      .single();

    let result;
    if (existingReview) {
        // Update
        const updates: any = {};
        if (scoreVal !== undefined) updates.score = scoreVal;
        if (notes !== undefined) updates.notes = notes;
        
        result = await supabase
            .from("application_reviews")
            .update(updates)
            .eq("id", existingReview.id)
            .select()
            .single();
    } else {
        // Insert
        result = await supabase
            .from("application_reviews")
            .insert({
                application_id: applicationId,
                reviewer_id: user.id,
                score: scoreVal !== undefined ? scoreVal : null,
                notes: notes || null
            })
            .select()
            .single();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
