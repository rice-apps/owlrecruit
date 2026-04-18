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

    const body = await request.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 },
      );
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

    return NextResponse.json({ id: newOrgId }, { status: 201 });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
