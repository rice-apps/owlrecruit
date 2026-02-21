import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: openings, error: fetchError } = await supabase
      .from("openings")
      .select(
        `
        *,
        org:orgs(name)
      `,
      )
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching openings:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch openings" },
        { status: 500 },
      );
    }

    return NextResponse.json(openings);
  } catch (error) {
    console.error("Error in openings API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
