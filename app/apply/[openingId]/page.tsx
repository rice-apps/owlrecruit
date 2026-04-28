import { Box, Text } from "@mantine/core";
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
    .select(
      "id, title, description, status, closes_at, org_id, orgs!org_id(name)",
    )
    .eq("id", openingId)
    .single();

  if (error || !opening) {
    return (
      <Box ta="center" py="5rem">
        <Text size="lg" fw={500} c="dimmed">
          Opening not found.
        </Text>
      </Box>
    );
  }

  if (opening.status !== "open") {
    return (
      <Box ta="center" py="5rem">
        <Text size="lg" fw={500} c="dimmed">
          This opening is not currently accepting applications.
        </Text>
      </Box>
    );
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_text, is_required, sort_order")
    .eq("opening_id", openingId)
    .order("sort_order", { ascending: true });

  const orgRow = Array.isArray(opening.orgs) ? opening.orgs[0] : opening.orgs;
  const orgName = (orgRow as { name: string } | null)?.name ?? "Unknown Org";

  let alreadyApplied = false;
  if (user) {
    const { data: userRecord } = await supabase
      .from("users")
      .select("net_id")
      .eq("id", user.id)
      .maybeSingle();

    if (userRecord?.net_id) {
      const { data: applicant } = await supabase
        .from("applicants")
        .select("id")
        .eq("net_id", userRecord.net_id)
        .maybeSingle();

      if (applicant) {
        const { data: existing } = await supabase
          .from("applications")
          .select("id")
          .eq("opening_id", openingId)
          .eq("applicant_id", applicant.id)
          .maybeSingle();
        alreadyApplied = !!existing;
      }
    }
  }

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
      alreadyApplied={alreadyApplied}
    />
  );
}
