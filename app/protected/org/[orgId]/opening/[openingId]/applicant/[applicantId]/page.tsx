"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Mail, Calendar, FileText } from "lucide-react";
import { ResumePreview } from "../../components";
import { createClient } from "@/lib/supabase/client";

export default function ApplicantReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { orgId, openingId, applicantId } = params as {
    orgId: string;
    openingId: string;
    applicantId: string;
  };

  const [applicationData, setApplicationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplication = async () => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("applications")
        .select("*, applicants(net_id, name)")
        .eq("id", applicantId)
        .single();

      if (error) {
        console.error("Error fetching application:", error);
      } else {
        console.log("Application data:", data);
        setApplicationData(data);
      }
      setLoading(false);
    };

    fetchApplication();
  }, [applicantId]);

  if (loading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center p-6">
        <p className="text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  if (!applicationData) {
    return (
      <div className="flex-1 w-full flex flex-col gap-6 p-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            router.push(`/protected/org/${orgId}/opening/${openingId}`)
          }
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Opening
        </Button>
        <p className="text-muted-foreground">Application not found</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-6 p-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            router.push(`/protected/org/${orgId}/opening/${openingId}`)
          }
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Opening
        </Button>
      </div>

      {/* Page Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Applicant Review</h1>
        <p className="text-muted-foreground">
          Review application details and resume
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Application Details */}
        <div className="space-y-6">
          {/* Applicant Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Applicant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xl font-semibold">
                  {applicationData.applicants?.name || "N/A"}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{applicationData.applicants?.net_id || "N/A"}</span>
                  <span>•</span>
                  <span>
                    {applicationData.applicants?.net_id
                      ? `${applicationData.applicants.net_id}@rice.edu`
                      : "N/A"}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <p className="text-lg font-semibold">{applicationData.status}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Applied Date
                </p>
                <p>{formatDate(applicationData.created_at)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Last Updated
                </p>
                <p>{formatDate(applicationData.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Application Responses Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Application Responses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applicationData.form_responses ? (
                <div className="space-y-3">
                  {Object.entries(applicationData.form_responses).map(
                    ([key, value]) => (
                      <div key={key} className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground capitalize">
                          {key}
                        </p>
                        <p className="text-sm">{String(value)}</p>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No responses available
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Resume */}
        <div>
          <ResumePreview
            resumeUrl={applicationData.resume_url}
            applicantName={applicationData.applicant_id}
          />
        </div>
      </div>
    </div>
  );
}
