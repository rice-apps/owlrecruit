"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Json } from "@/types/supabase";
import { createClient } from "@/lib/supabase/client";
import { ApplicantTabs } from "./components/ApplicantTabs";


interface ApplicationData {
  form_responses: Json;
  resume_url: string | null;
}

export default function ApplicantReviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { orgId, openingId, applicantId } = params as {
    orgId: string;
    openingId: string;
    applicantId: string;
  };

  const tab = searchParams.get("tab") || "overview";
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

  const formData = typeof applicationData?.form_responses === "object" && applicationData?.form_responses 
    ? (applicationData.form_responses as Record<string, any>) 
    : {};
  const applicantName = formData["Name"] || "Unknown Applicant";
  const applicantEmail = formData["Email"] || "Unknown Email";
  const applicantMajor = formData["Major"] || "Unknown Major";

  const renderTabContent = () => {
    switch (tab) {
      case "submission":
        return (
          <div className="space-y-4">
        
            {applicationData?.form_responses && typeof applicationData.form_responses === "object" && !Array.isArray(applicationData.form_responses) && (
              <div>
                <p className="text-xl text-muted-foreground">Form Responses:</p>
                {Object.entries(applicationData.form_responses).map(([key, value]) => (
                  <div key={key}>
                    <p>
                      <br/>
                      <strong>{key} </strong> 
                      <br/>
                      <span style={{ textDecoration: 'underline', textDecorationColor: 'gray' }}>
                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                      </span>   
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "files":
        return (
          <div className="space-y-4">
            {applicationData?.resume_url && (
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
          </div> 
        );
      case "summary":
        return <div><p>Summary content here</p></div>;
      default:
        return null;
    }
  };

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

      <h1 className="text-3xl font-bold">{applicantName}</h1>
      <h2 className="text-xl text-muted-foreground">{applicantEmail} {applicantMajor}</h2>
      
      {loading ? (
        <p>Loading application data...</p>
      ) : (
        <>
          <ApplicantTabs />
          <div className="flex-1">{renderTabContent()}</div>
        </>
      )}
    </div>
  );
}
