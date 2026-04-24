import { notFound } from "next/navigation";
import { OpeningFormPage } from "@/components/opening-form/opening-form-page";
import { getOpeningInitialData } from "./opening-edit-data";

interface EditOpeningPageProps {
  params: Promise<{ orgId: string; openingId: string }>;
}

export default async function EditOpeningPage({
  params,
}: EditOpeningPageProps) {
  const { orgId, openingId } = await params;
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
    />
  );
}
