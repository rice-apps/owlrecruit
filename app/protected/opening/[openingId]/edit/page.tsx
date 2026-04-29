import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OpeningFormPage } from "@/components/opening-form/opening-form-page";
import { getOpeningInitialData } from "./opening-edit-data";

interface EditOpeningPageProps {
  params: Promise<{ openingId: string }>;
}

export default async function EditOpeningPage({
  params,
}: EditOpeningPageProps) {
  const { openingId } = await params;
  const supabase = await createClient();

  // Derive orgId from the opening record
  const { data: opening } = await supabase
    .from("openings")
    .select("org_id")
    .eq("id", openingId)
    .single();

  if (!opening) {
    notFound();
  }

  const orgId = opening.org_id;
  const initialOpening = await getOpeningInitialData(orgId, openingId);

  if (!initialOpening) {
    notFound();
  }

  return (
    <OpeningFormPage
      mode="edit"
      orgId={orgId}
      openingId={openingId}
      initialOpening={initialOpening}
      openingHref={`/protected/opening/${openingId}`}
    />
  );
}
