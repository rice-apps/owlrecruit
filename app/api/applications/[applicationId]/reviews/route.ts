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
      return NextResponse.json(
        { error: commentsError.message },
        { status: 500 },
      );
    }

    const formattedComments = comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.created_at,
      userName: (c.user as any)?.name || "Unknown",
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

    return NextResponse.json({ comments: formattedComments, myScoreSkills });
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
        { error: "At least one of scoreSkills or notes/content must be provided" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("id, openings!inner(org_id)")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const orgId = (application.openings as any).org_id;

    const { data: membership, error: memberError } = await supabase
      .from("org_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const results: { comment?: any; review?: any } = {};

    if (commentContent) {
      const { data: comment, error: commentError } = await supabase
        .from("comments")
        .insert({
          application_id: applicationId,
          user_id: user.id,
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
        .eq("reviewer_id", user.id)
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
            reviewer_id: user.id,
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
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

