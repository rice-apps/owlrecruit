"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Json } from "@/types/supabase";
import { createClient } from "@/lib/supabase/client";
import { ApplicantTabs } from "./components/ApplicantTabs";
import { BlankModal } from "./components/ApplicantReviews";

interface ApplicationData {
  form_responses: Json;
  resume_url: string | null;
}

interface ResumeViewerProps {
  resumeUrl: string | null;
}

function ResumeViewer({ resumeUrl }: ResumeViewerProps) {
  if (!resumeUrl) {
    return <div className="text-gray-500">No resume available</div>;
  }

  // Convert Google Drive URL to preview URL
  const getPreviewUrl = (url: string): string => {
    // Extract file ID from various Google Drive URL formats
    // Format 1: https://drive.google.com/open?id=FILE_ID
    // Format 2: https://drive.google.com/file/d/FILE_ID/view
    // Format 3: https://drive.google.com/uc?id=FILE_ID
    let fileId = '';
    if (url.includes('/open?id=')) {
      fileId = url.split('/open?id=')[1].split('&')[0];
    } else if (url.includes('/file/d/')) {
      fileId = url.split('/file/d/')[1].split('/')[0];
    } else if (url.includes('?id=')) {
      fileId = url.split('?id=')[1].split('&')[0];
    }
    return `https://drive.google.com/file/d/${fileId}/preview`;
  };
  const previewUrl = getPreviewUrl(resumeUrl);
  return (
    <div className="w-full h-[800px]">
      <iframe
        src={previewUrl}
        className="w-full h-full border rounded-lg"
        title="Applicant Resume"
        allow="autoplay"
      />
    </div>
  );
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
                <BlankModal />
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
                <ResumeViewer resumeUrl={applicationData.resume_url} />
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
          <div className="flex gap-4">  
              <div className="w-2/3 border-r border-gray-300 pr-4 w-2/3">{renderTabContent()}</div>
              <div className="w-1/3">
                  <div className="flex justify-end">
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-l-full hover:bg-blue-600">
                      Left
                    </button>
                    <div className="w-px bg-white"></div>
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-r-full hover:bg-blue-600">
                      Right
                    </button>
                  </div>
              </div>
          </div>
          
        </>
      )}
    </div>
  );
}
