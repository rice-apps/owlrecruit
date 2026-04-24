import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string | null;
    const description = formData.get("description") as string | null;
    const logoFile = formData.get("logo") as File | null;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 },
      );
    }

    // Upload logo if provided
    let logo_url: string | null = null;
    if (logoFile && logoFile.size > 0) {
      const ext = logoFile.name.split(".").pop();
      const path = `logos/${crypto.randomUUID()}.${ext}`;
      const bytes = await logoFile.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("org-assets")
        .upload(path, bytes, { contentType: logoFile.type });

      if (uploadError) {
        return NextResponse.json(
          { error: "Failed to upload logo" },
          { status: 500 },
        );
      }

      const { data: urlData } = supabase.storage
        .from("org-assets")
        .getPublicUrl(path);

      logo_url = urlData.publicUrl;
    }

    // Atomically create org and assign creator as admin
    const { data: newOrgId, error: rpcError } = await supabase.rpc(
      "create_org_with_admin",
      {
        org_name: name.trim(),
        org_description: description?.trim() || null,
        creator_id: user.id,
      },
    );

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    if (logo_url) {
      const { error: updateError } = await supabase
        .from("orgs")
        .update({ logo_url })
        .eq("id", newOrgId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }


    return NextResponse.json({ id: newOrgId }, { status: 201 });
  } catch (error) {
    logger.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
