import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("openings")
      .select(
        `
        id,
        title,
        description,
        application_link,
        status,
        closes_at,
        orgs (
          name
        ),
        rubric
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to flatten org name
    const openings = data.map((opening) => {
      // Supabase returns nested relation as object for FK, but TS infers as array
      const org = Array.isArray(opening.orgs) ? opening.orgs[0] : opening.orgs;

      // Cast rubric to expected type since it's Json
      const rubric =
        (opening.rubric as any as Array<{ name: string; max_val: number }>) ??
        [];

      return {
        id: opening.id,
        org_name: org?.name ?? null,
        title: opening.title,
        description: opening.description,
        application_link: opening.application_link,
        status: opening.status,
        closes_at: opening.closes_at,
        rubrics: rubric.map((r) => ({
          name: r.name,
          max_val: r.max_val,
        })),
      };
    });

    return NextResponse.json(openings);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
