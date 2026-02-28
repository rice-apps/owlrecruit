import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await params;
    const userId = userData.user.id;

    // Verify the membership belongs to the current user
    const { data: membership, error: fetchError } = await supabase
      .from("org_members")
      .select("id, user_id, org_id")
      .eq("id", memberId)
      .single();

    if (fetchError || !membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 },
      );
    }

    if (membership.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the membership
    const { error: deleteError } = await supabase
      .from("org_members")
      .delete()
      .eq("id", memberId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ success: true, message: "Left organization" });
  } catch (error) {
    console.error("Error leaving organization:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
