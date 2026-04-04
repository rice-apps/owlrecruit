import { createClient } from "@/lib/supabase/server";
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

    // Create the organization
    const { data: newOrg, error: insertError } = await supabase
      .from("orgs")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        logo_url,
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Add the creator as an admin of the organization
    const { error: memberError } = await supabase.from("org_members").insert({
      user_id: user.id,
      org_id: newOrg.id,
      role: "admin",
    });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    return NextResponse.json({ id: newOrg.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
