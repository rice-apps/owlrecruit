import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/org/[orgId]/openings/[openingId]/reviewers
 *
 * Returns the list of reviewers assigned to this opening, with user details.
 * Reads reviewer_ids from the openings table, then fetches user info.
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ orgId: string; openingId: string }> },
) {
    const { orgId, openingId } = await params;
    const supabase = await createClient();

    // Fetch the opening and its reviewer_ids
    const { data: opening, error: openingError } = await supabase
        .from("openings")
        .select("org_id, reviewer_ids")
        .eq("id", openingId)
        .single();

    if (openingError || !opening) {
        return NextResponse.json(
            { error: "Opening not found" },
            { status: 404 },
        );
    }

    if (opening.org_id !== orgId) {
        return NextResponse.json(
            { error: "Opening does not belong to this organization" },
            { status: 400 },
        );
    }

    const reviewerIds = (opening.reviewer_ids as string[]) ?? [];

    if (reviewerIds.length === 0) {
        return NextResponse.json([]);
    }

    // Fetch user details for the reviewer IDs
    const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", reviewerIds);

    if (usersError) {
        return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    const reviewers = (users ?? []).map((u) => ({
        id: u.id,
        user_id: u.id,
        name: u.name,
        email: u.email,
    }));

    return NextResponse.json(reviewers);
}

/**
 * PUT /api/org/[orgId]/openings/[openingId]/reviewers
 *
 * Replaces the full set of assigned reviewers for this opening.
 * Body: { reviewer_user_ids: string[] }
 *
 * Only org admins may call this.
 */
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ orgId: string; openingId: string }> },
) {
    const { orgId, openingId } = await params;
    const supabase = await createClient();

    // Auth check
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin check
    const { data: membership } = await supabase
        .from("org_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("org_id", orgId)
        .single();

    if (membership?.role !== "admin") {
        return NextResponse.json(
            { error: "Only admins can manage reviewer assignments" },
            { status: 403 },
        );
    }

    // Verify opening belongs to org
    const { data: opening } = await supabase
        .from("openings")
        .select("org_id")
        .eq("id", openingId)
        .single();

    if (!opening || opening.org_id !== orgId) {
        return NextResponse.json(
            { error: "Opening not found" },
            { status: 404 },
        );
    }

    const { reviewer_user_ids } = await request.json();

    if (!Array.isArray(reviewer_user_ids)) {
        return NextResponse.json(
            { error: "reviewer_user_ids must be an array" },
            { status: 400 },
        );
    }

    // Update reviewer_ids on the opening
    const { error: updateError } = await supabase
        .from("openings")
        .update({ reviewer_ids: reviewer_user_ids })
        .eq("id", openingId);

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
