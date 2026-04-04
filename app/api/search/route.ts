import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json({ openings: [], orgs: [] });
    }

    const supabase = await createClient();

    const [openingsResult, orgsResult] = await Promise.all([
      supabase
        .from("openings")
        .select(
          `
          *,
          org:orgs(name)
        `,
        )
        .eq("status", "open")
        .ilike("title", `%${query}%`)
        .order("created_at", { ascending: false }),

      supabase
        .from("orgs")
        .select("*")
        .ilike("name", `%${query}%`)
        .order("name", { ascending: true }),
    ]);

    return NextResponse.json({
      openings: openingsResult.data || [],
      orgs: orgsResult.data || [],
    });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
