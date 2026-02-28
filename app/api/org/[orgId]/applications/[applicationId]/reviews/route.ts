import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; applicationId: string }> },
) {
  const { orgId, applicationId } = await params;
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("applications")
    .select("resume_url, openings!inner(org_id, rubric)")
    .eq("id", applicationId)
    .single();

  if (!application) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 },
    );
  }

  const opening = Array.isArray(application.openings)
    ? application.openings[0]
    : (application.openings as { org_id: string; rubric: unknown[] | null });
  const appOrgId = opening?.org_id;

  if (appOrgId !== orgId) {
    return NextResponse.json(
      { error: "Application does not belong to this organization" },
      { status: 400 },
    );
  }

  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select(
      `
      id,
      content,
      created_at,
      user:users!user_id(name)
    `,
    )
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  if (commentsError) {
    return NextResponse.json({ error: commentsError.message }, { status: 500 });
  }

  const formattedComments = comments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.created_at,
    userName:
      ((c.user as { name: string } | { name: string }[] | null) &&
        (Array.isArray(c.user)
          ? c.user[0]?.name
          : (c.user as { name: string })?.name)) ||
      "Unknown",
  }));

  const rubric = (
    (opening?.rubric as Array<{ name: string; max_val: number }> | null) ?? []
  ).map((item) => ({
    name: item.name,
    max_val: item.max_val,
  }));

  const { data: allReviews, error: reviewsError } = await supabase
    .from("application_reviews")
    .select(
      `
      id,
      reviewer_id,
      score_skills,
      created_at,
      updated_at,
      reviewer:users!reviewer_id(name)
    `,
    )
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });

  if (reviewsError) {
    return NextResponse.json({ error: reviewsError.message }, { status: 500 });
  }

  const reviewerScores = (allReviews ?? []).map((review) => ({
    id: review.id,
    reviewerId: review.reviewer_id,
    reviewerName:
      ((review.reviewer as { name: string } | { name: string }[] | null) &&
        (Array.isArray(review.reviewer)
          ? review.reviewer[0]?.name
          : (review.reviewer as { name: string })?.name)) ||
      "Unknown",
    scoreSkills: review.score_skills as Record<string, number> | null,
    createdAt: review.created_at,
    updatedAt: review.updated_at,
  }));

  let myScoreSkills: Record<string, number> | null = null;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: myReview } = await supabase
      .from("application_reviews")
      .select("score_skills")
      .eq("application_id", applicationId)
      .eq("reviewer_id", user.id)
      .single();

    if (myReview?.score_skills) {
      myScoreSkills = myReview.score_skills as Record<string, number>;
    }
  }

  return NextResponse.json({
    comments: formattedComments,
    myScoreSkills,
    summary: {
      rubric,
      reviewerScores,
      resumeUrl: application.resume_url,
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; applicationId: string }> },
) {
  const { orgId, applicationId } = await params;
  const supabase = await createClient();

  let body: {
    scoreSkills?: Record<string, number>;
    notes?: string;
    content?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const commentContent = body.notes || body.content;
  const scoreSkills = body.scoreSkills;

  if (!scoreSkills && !commentContent) {
    return NextResponse.json(
      {
        error: "At least one of scoreSkills or notes/content must be provided",
      },
      { status: 400 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: application } = await supabase
    .from("applications")
    .select("id, openings!inner(org_id)")
    .eq("id", applicationId)
    .single();

  if (!application) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 },
    );
  }

  const appOrgId = Array.isArray(application.openings)
    ? application.openings[0]?.org_id
    : (application.openings as { org_id: string }).org_id;

  if (appOrgId !== orgId) {
    return NextResponse.json(
      { error: "Application does not belong to this organization" },
      { status: 400 },
    );
  }

  const results: { comment?: unknown; review?: unknown } = {};

  if (commentContent) {
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .insert({
        application_id: applicationId,
        user_id: user!.id,
        content: commentContent,
      })
      .select()
      .single();

    if (commentError) {
      return NextResponse.json(
        { error: commentError.message },
        { status: 500 },
      );
    }
    results.comment = comment;
  }

  if (scoreSkills !== undefined) {
    const { data: existingReview } = await supabase
      .from("application_reviews")
      .select("id")
      .eq("application_id", applicationId)
      .eq("reviewer_id", user!.id)
      .single();

    let reviewResult;
    if (existingReview) {
      reviewResult = await supabase
        .from("application_reviews")
        .update({ score_skills: scoreSkills })
        .eq("id", existingReview.id)
        .select()
        .single();
    } else {
      reviewResult = await supabase
        .from("application_reviews")
        .insert({
          application_id: applicationId,
          reviewer_id: user!.id,
          score_skills: scoreSkills,
        })
        .select()
        .single();
    }

    if (reviewResult.error) {
      return NextResponse.json(
        { error: reviewResult.error.message },
        { status: 500 },
      );
    }
    results.review = reviewResult.data;
  }

  return NextResponse.json(results, { status: 201 });
}
