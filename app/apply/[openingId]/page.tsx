import { createClient } from "@/lib/supabase/server";
import { ApplyForm } from "./ApplyForm";

interface Props {
  params: Promise<{ openingId: string }>;
}

export default async function ApplyPage({ params }: Props) {
  const { openingId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: opening, error } = await supabase
    .from("openings")
    .select("id, title, description, status, closes_at, orgs(name)")
    .eq("id", openingId)
    .single();

  if (error || !opening) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium">Opening not found.</p>
      </div>
    );
  }

  if (opening.status !== "open") {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium">
          This opening is not currently accepting applications.
        </p>
      </div>
    );
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_text, is_required, sort_order")
    .eq("opening_id", openingId)
    .order("sort_order", { ascending: true });

  const orgName =
    opening.orgs && !Array.isArray(opening.orgs)
      ? (opening.orgs as { name: string }).name
      : Array.isArray(opening.orgs) && opening.orgs.length > 0
        ? (opening.orgs[0] as { name: string }).name
        : "Unknown Org";

  return (
    <ApplyForm
      openingId={openingId}
      title={opening.title}
      description={opening.description ?? ""}
      orgName={orgName}
      closesAt={opening.closes_at}
      questions={questions ?? []}
      isAuthenticated={!!user}
      userEmail={user?.email ?? null}
    />
  );
}
