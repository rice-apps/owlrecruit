import { OpeningFormPage } from "@/components/opening-form/opening-form-page";

interface NewOpeningPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function NewOpeningPage({ params }: NewOpeningPageProps) {
  const { orgId } = await params;

  return <OpeningFormPage mode="create" orgId={orgId} />;
}
