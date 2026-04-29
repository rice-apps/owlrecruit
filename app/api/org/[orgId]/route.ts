import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logger";
import type { TablesUpdate } from "@/types/database";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const log = createRequestLogger({
    method: "PATCH",
    path: `/api/org/${orgId}`,
    org_id: orgId,
  });

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    log.flush(401);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  log.set({ user_id: user.id });

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .single();

  if (membership?.role !== "admin") {
    log.flush(403);
    return NextResponse.json(
      { error: "Only admins can edit this organization" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const name: string | undefined = body.name;
  const description: string | undefined = body.description;

  if (name !== undefined && !name?.trim()) {
    log.flush(400);
    return NextResponse.json(
      { error: "Organization name cannot be empty" },
      { status: 400 },
    );
  }

  const updates: TablesUpdate<"orgs"> = {};
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined)
    updates.description = description?.trim() || null;

  const { error: updateError } = await supabase
    .from("orgs")
    .update(updates)
    .eq("id", orgId);

  if (updateError) {
    log.error("error updating org", updateError);
    log.flush(500);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  log.set({ updated_fields: Object.keys(updates) });
  log.flush(200);
  return NextResponse.json({ success: true });
}
