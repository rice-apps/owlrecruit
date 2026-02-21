"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CommentsSidebar } from "./components/comments-sidebar";

export default function ApplicantReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { orgId, openingId, applicantId } = params as {
    orgId: string;
    openingId: string;
    applicantId: string;
  };

  return (
    <div className="flex-1 w-full flex gap-6 h-[calc(100vh-theme(spacing.16))]">
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/protected/org/${orgId}/opening/${openingId}`)
          }
          className="w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Opening
        </Button>

        <h1 className="text-3xl font-bold">Applicant Review</h1>
        <h2 className="text-xl text-muted-foreground">
          Reviewing applicant &quot;{applicantId}&quot; for opening &quot;
          {openingId}&quot; in org &quot;
          {orgId}&quot; - shows application details, resume, etc
        </h2>
      </div>
      <CommentsSidebar
        applicantId={applicantId}
        openingId={openingId}
        orgId={orgId}
      />
    </div>
  );
}
