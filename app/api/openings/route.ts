import { createClient } from "@/lib/supabase/server";
import { createRequestLogger } from "@/lib/logger";
import { err, ok } from "@/lib/api-response";
import { requireOrgAdmin } from "@/lib/auth";
import { OpeningStatus } from "@/types/app";

export async function GET(request: Request) {
  const log = createRequestLogger({ method: "GET", path: "/api/openings" });
  try {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();

    const statuses = searchParams.get("statuses")?.split(",") || [
      OpeningStatus.OPEN,
    ];

    log.set({ statuses });

    let query = supabase.from("openings").select(
      `
        *,
        org:orgs(name, logo_url)
      `,
    );

    if (statuses.length === 1) {
      query = query.eq("status", statuses[0]);
    } else {
      query = query.in("status", statuses);
    }

    query = query.order("created_at", { ascending: false });

    const { data: openings, error: fetchError } = await query;

    if (fetchError) {
      log.error("error fetching openings", fetchError);
      log.flush(500);
      return err("Failed to fetch openings", 500);
    }

    // Attach the current user's application status to each opening (if logged in)
    let applicationStatusMap: Record<string, string> = {};
    const { data: authData } = await supabase.auth.getClaims();
    if (authData?.claims && openings && openings.length > 0) {
      log.set({ user_id: authData.claims.sub });

      // Resolve applicant_id via net_id so CSV-uploaded applications are included
      const { data: userData } = await supabase
        .from("users")
        .select("net_id")
        .eq("id", authData.claims.sub)
        .single();

      if (userData?.net_id) {
        const { data: applicantData } = await supabase
          .from("applicants")
          .select("id")
          .eq("net_id", userData.net_id)
          .single();

        if (applicantData) {
          const openingIds = openings.map((o) => o.id);
          const { data: userApplications } = await supabase
            .from("applications")
            .select("opening_id, status")
            .eq("applicant_id", applicantData.id)
            .in("opening_id", openingIds);

          if (userApplications) {
            applicationStatusMap = Object.fromEntries(
              userApplications.map((a) => [a.opening_id, a.status]),
            );
          }
        }
      }
    }

    const enriched = (openings ?? []).map((o) => ({
      ...o,
      applicationStatus: applicationStatusMap[o.id] ?? null,
    }));

    log.set({ result_count: enriched.length });
    log.flush(200);
    return ok(enriched);
  } catch (error) {
    log.error("unexpected error in openings GET", error);
    log.flush(500);
    return err("Internal Server Error", 500);
  }
}

export async function POST(request: Request) {
  const log = createRequestLogger({ method: "POST", path: "/api/openings" });
  try {
    const supabase = await createClient();

    const body = await request.json();
    const { org_id, title, description, application_link, closes_at, status } =
      body;
    log.set({ org_id });

    if (!title?.trim()) {
      log.flush(400);
      return err("Position title is required", 400);
    }

    const { userId } = await requireOrgAdmin(supabase, org_id);
    log.set({ user_id: userId });

    const { data, error } = await supabase
      .from("openings")
      .insert({
        org_id,
        title: title.trim(),
        description: description?.trim() || null,
        application_link: application_link?.trim() || null,
        closes_at: closes_at || null,
        status: status || OpeningStatus.OPEN,
      })
      .select()
      .single();

    if (error) {
      log.error("error inserting opening", error);
      log.flush(500);
      return err(error.message, 500);
    }

    log.set({ opening_id: data.id });
    log.flush(200);
    return ok(data);
  } catch (e) {
    if (e instanceof Response) return e;
    log.error("unexpected error in openings POST", e);
    log.flush(500);
    return err("Internal Server Error", 500);
  }
}
