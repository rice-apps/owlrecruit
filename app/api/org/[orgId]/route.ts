import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logger";

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

  const contentType = request.headers.get("content-type") || "";
  let name: string | undefined;
  let description: string | undefined;
  let logoFile: File | null = null;

  if (contentType.includes("application/json")) {
    const body = await request.json();
    name = body.name;
    description = body.description;
  } else if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    name = formData.get("name") as string | undefined;
    description = formData.get("description") as string | undefined;
    logoFile = formData.get("logo") as File | null;
  }

  if (name !== undefined && !name?.trim()) {
    log.flush(400);
    return NextResponse.json(
      { error: "Organization name cannot be empty" },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined)
    updates.description = description?.trim() || null;

  // Handle logo upload if provided
  if (logoFile && logoFile.size > 0) {
    const ext = logoFile.name.split(".").pop();
    const path = `logos/${crypto.randomUUID()}.${ext}`;
    const bytes = await logoFile.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("org-assets")
      .upload(path, bytes, { contentType: logoFile.type });

    if (uploadError) {
      log.error("Logo upload failed", uploadError);
      log.flush(500);
      return NextResponse.json(
        { error: "Failed to upload logo" },
        { status: 500 },
      );
    }

    const { data: urlData } = supabase.storage
      .from("org-assets")
      .getPublicUrl(path);

    updates.logo_url = urlData.publicUrl;
  }

  const { error: updateError } = await supabase
    .from("orgs")
    .update(updates)
    .eq("id", orgId);

  if (updateError) {
    log.error("Error updating org", updateError);
    log.flush(500);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  log.set({ updated_fields: Object.keys(updates) });
  log.flush(200);
  return NextResponse.json({ success: true });
}
