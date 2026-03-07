import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/org/[orgId]/openings/[openingId]/reviewers
 *
 * Returns the list of reviewers assigned to this opening, with user details.
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ orgId: string; openingId: string }> },
) {
    const { orgId, openingId } = await params;
    const supabase = await createClient();

    // Verify the opening belongs to the org
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

    // Fetch assigned reviewers with user details
    const { data, error } = await supabase
        .from("opening_reviewers")
        .select(
            `
      id,
      user_id,
      users:user_id (
        id,
        name,
        email
      )
    `,
        )
        .eq("opening_id", openingId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normalise shape: flatten the nested users object
    const reviewers = (data ?? []).map(
        (row: { id: string; user_id: string; users: unknown }) => {
            const u = Array.isArray(row.users) ? row.users[0] : row.users;
            return {
                id: row.id,
                user_id: row.user_id,
                name: (u as { name?: string | null })?.name ?? null,
                email: (u as { email?: string | null })?.email ?? null,
            };
        },
    );

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

    // Delete all existing assignments for this opening
    const { error: deleteError } = await supabase
        .from("opening_reviewers")
        .delete()
        .eq("opening_id", openingId);

    if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Insert new assignments
    if (reviewer_user_ids.length > 0) {
        const rows = reviewer_user_ids.map((userId: string) => ({
            opening_id: openingId,
            user_id: userId,
        }));

        const { error: insertError } = await supabase
            .from("opening_reviewers")
            .insert(rows);

        if (insertError) {
            return NextResponse.json(
                { error: insertError.message },
                { status: 500 },
            );
        }
    }

    return NextResponse.json({ success: true });
}
