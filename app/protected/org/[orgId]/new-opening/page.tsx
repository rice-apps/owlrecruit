"use client";

import { useParams } from "next/navigation";
import { OpeningFormPage } from "@/components/opening-form/opening-form-page";

export default function NewOpeningPage() {
  const { orgId } = useParams<{ orgId: string }>();
  // TODO: add an "Applicant Stages" section (badges + non-functional "Add stage" button)
  return <OpeningFormPage mode="create" orgId={orgId} />;
}
