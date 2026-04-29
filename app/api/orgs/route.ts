import { createClient } from "@/lib/supabase/server";
import { createRequestLogger } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const log = createRequestLogger({ method: "POST", path: "/api/orgs" });
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      log.flush(401);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    log.set({ user_id: user.id });

    const body = await request.json();
    const name = body.name as string | null;
    const description = body.description as string | null;

    if (!name?.trim()) {
      log.flush(400);
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 },
      );
    }

    const logo_url: string | null = null;

    // Atomically create org and assign creator as admin
    const { data: newOrgId, error: rpcError } = await supabase.rpc(
      "create_org_with_admin",
      {
        org_name: name.trim(),
        org_description: description?.trim() || "",
        creator_id: user.id,
      },
    );

    if (rpcError) {
      log.error("supabase RPC error creating org", rpcError);
      log.flush(500);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    if (logo_url && newOrgId) {
      const { error: updateError } = await supabase
        .from("orgs")
        .update({ logo_url })
        .eq("id", newOrgId);

      if (updateError) {
        log.error("error attaching logo to org", updateError);
        log.flush(500);
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 },
        );
      }
    }

    log.set({ org_id: newOrgId });
    log.flush(201);
    return NextResponse.json({ id: newOrgId }, { status: 201 });
  } catch (error) {
    log.error("unexpected error creating organization", error);
    log.flush(500);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
