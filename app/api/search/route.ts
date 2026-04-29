import { createClient } from "@/lib/supabase/server";
import { createRequestLogger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { OpeningStatus } from "@/types/app";

export async function GET(request: Request) {
  const log = createRequestLogger({ method: "GET", path: "/api/search" });
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    log.set({ search_query: query });

    if (!query) {
      log.flush(200);
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
        .eq("status", OpeningStatus.OPEN)
        .ilike("title", `%${query}%`)
        .order("created_at", { ascending: false }),

      supabase
        .from("orgs")
        .select("*")
        .ilike("name", `%${query}%`)
        .order("name", { ascending: true }),
    ]);

    if (openingsResult.error) {
      log.error("error fetching openings in search", openingsResult.error);
    }
    if (orgsResult.error) {
      log.error("error fetching orgs in search", orgsResult.error);
    }

    log.set({
      openings_count: openingsResult.data?.length ?? 0,
      orgs_count: orgsResult.data?.length ?? 0,
    });
    log.flush(200);
    return NextResponse.json({
      openings: openingsResult.data || [],
      orgs: orgsResult.data || [],
    });
  } catch (error) {
    log.error("unexpected error in search", error);
    log.flush(500);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
