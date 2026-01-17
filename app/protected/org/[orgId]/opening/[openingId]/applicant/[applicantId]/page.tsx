"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Json } from "@/types/supabase";
import { createClient } from "@/lib/supabase/client";

interface ApplicationData {
  form_responses: Json;
  resume_url: string | null;
}

export default function ApplicantReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { orgId, openingId, applicantId } = params as {
    orgId: string;
    openingId: string;
    applicantId: string;
  };

  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApplicationData() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("applications")
          .select("form_responses, resume_url")
          .eq("id", applicantId)
          .single();

        if (error) throw error;
        setApplicationData(data);
      } catch (err) {
        console.error("Error fetching application data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchApplicationData();
  }, [applicantId]);

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
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
        {orgId}&quot;
      </h2>
      
      {loading ? (
        <p>Loading application data...</p>
      ) : applicationData ? (
        <div className="space-y-4">
          {applicationData.resume_url && (
            <div>
              <p className="text-xl text-muted-foreground">Resume:</p>
              <a
                href={applicationData.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {applicationData.resume_url}
              </a>
            </div>
          )}
          {applicationData.form_responses && (
            <div>
              <p className="text-xl text-muted-foreground">Form Responses:
                {JSON.stringify(applicationData.form_responses, null, 2)}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p>No application data found.</p>
      )}
    </div>
  );
}
