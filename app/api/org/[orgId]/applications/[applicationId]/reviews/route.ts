import { createClient } from "@/lib/supabase/server";
import { type NextRequest } from "next/server";
import { ok, err } from "@/lib/api-response";
import { requireOrgMember } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; applicationId: string }> },
) {
  try {
    const { orgId, applicationId } = await params;
    const supabase = await createClient();

    await requireOrgMember(supabase, orgId);

    const { data: application } = await supabase
      .from("applications")
      .select("resume_url, openings!inner(org_id, rubric)")
      .eq("id", applicationId)
      .single();

    if (!application) return err("Application not found", 404);

    const opening = (
      Array.isArray(application.openings)
        ? application.openings[0]
        : application.openings
    ) as { org_id: string; rubric: unknown[] | null } | null;
    const appOrgId = opening?.org_id;

    if (appOrgId !== orgId)
      return err("Application does not belong to this organization");

    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("id, content, created_at, user:users!user_id(name)")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false });

    if (commentsError) return err(commentsError.message, 500);

    const formattedComments = (comments ?? []).map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.created_at,
      userName:
        (Array.isArray(c.user)
          ? (c.user[0] as { name: string } | undefined)?.name
          : (c.user as { name: string } | null)?.name) ?? "Unknown",
    }));

    const rubric = (
      (opening?.rubric ?? []) as Array<{ name: string; max_val: number }>
    ).map((item) => ({ name: item.name, max_val: item.max_val }));

    const { data: allReviews, error: reviewsError } = await supabase
      .from("application_reviews")
      .select(
        "id, reviewer_id, score_skills, created_at, updated_at, reviewer:users!reviewer_id(name)",
      )
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false });

    if (reviewsError) return err(reviewsError.message, 500);

    const reviewerScores = (allReviews ?? []).map((review) => ({
      id: review.id,
      reviewerId: review.reviewer_id,
      reviewerName:
        (Array.isArray(review.reviewer)
          ? (review.reviewer[0] as { name: string } | undefined)?.name
          : (review.reviewer as { name: string } | null)?.name) ?? "Unknown",
      scoreSkills: review.score_skills as Record<string, number> | null,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
    }));

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let myScoreSkills: Record<string, number> | null = null;
    if (user) {
      const { data: myReview } = await supabase
        .from("application_reviews")
        .select("score_skills")
        .eq("application_id", applicationId)
        .eq("reviewer_id", user.id)
        .maybeSingle();

      if (myReview?.score_skills) {
        myScoreSkills = myReview.score_skills as Record<string, number>;
      }
    }

    return ok({
      comments: formattedComments,
      myScoreSkills,
      summary: {
        rubric,
        reviewerScores,
        resumeUrl: application.resume_url,
      },
    });
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

    let body: {
      scoreSkills?: Record<string, number>;
      notes?: string;
      content?: string;
    };
    try {
      body = await request.json();
    } catch {
      return err("Invalid JSON body");
    }

    const commentContent = body.notes || body.content;
    const scoreSkills = body.scoreSkills;

    if (!scoreSkills && !commentContent) {
      return err(
        "At least one of scoreSkills or notes/content must be provided",
      );
    }

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

    const results: { comment?: unknown; review?: unknown } = {};

    if (commentContent) {
      const { data: comment, error: commentError } = await supabase
        .from("comments")
        .insert({
          application_id: applicationId,
          user_id: userId,
          content: commentContent,
        })
        .select()
        .single();

      if (commentError) return err(commentError.message, 500);
      results.comment = comment;
    }

    if (scoreSkills !== undefined) {
      const { data: existingReview } = await supabase
        .from("application_reviews")
        .select("id")
        .eq("application_id", applicationId)
        .eq("reviewer_id", userId)
        .maybeSingle();

      let reviewResult;
      if (existingReview) {
        reviewResult = await supabase
          .from("application_reviews")
          .update({
            score_skills: scoreSkills,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingReview.id)
          .select()
          .single();
      } else {
        reviewResult = await supabase
          .from("application_reviews")
          .insert({
            application_id: applicationId,
            reviewer_id: userId,
            score_skills: scoreSkills,
          })
          .select()
          .single();
      }

      if (reviewResult.error) return err(reviewResult.error.message, 500);
      results.review = reviewResult.data;
    }

    return ok(results, 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return err("Internal Server Error", 500);
  }
}
