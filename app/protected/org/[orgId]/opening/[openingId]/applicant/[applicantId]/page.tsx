import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Calendar, FileText } from "lucide-react";
import { ResumePreview } from "../../components";

interface ApplicantReviewPageProps {
  params: Promise<{ orgId: string; openingId: string; applicantId: string }>;
}

export default async function ApplicantReviewPage({
  params,
}: ApplicantReviewPageProps) {
  const { orgId, openingId, applicantId } = await params;

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Fetch the application data
  const { data: application, error: fetchError } = await supabase
    .from("applications")
    .select(
      `
      id,
      resume_url,
      status,
      applicant_id,
      form_responses,
      created_at,
      updated_at
    `,
    )
    .eq("id", applicantId)
    .single();

  // Fetch the user data separately
  let user = null;
  if (application?.applicant_id) {
    const { data: userData } = await supabase
      .from("users")
      .select("id, name, email, net_id")
      .eq("id", application.applicant_id)
      .single();
    user = userData;
  }

  if (fetchError) {
    console.error("Error fetching application:", fetchError);
  }

  // Extract the file path from the stored signed URL and generate a fresh one
  let signedResumeUrl: string | null = null;
  if (application?.resume_url) {
    // Stored URL format: .../storage/v1/object/sign/Media_Bucket/<filepath>?token=...
    const bucketPrefix = "/storage/v1/object/sign/Media_Bucket/";
    const idx = application.resume_url.indexOf(bucketPrefix);
    if (idx !== -1) {
      const pathWithParams = application.resume_url.slice(
        idx + bucketPrefix.length,
      );
      const filePath = decodeURIComponent(pathWithParams.split("?")[0]);

      const { data, error } = await adminSupabase.storage
        .from("Media_Bucket")
        .createSignedUrl(filePath, 86400); // 1 day expiration

      if (error) {
        console.error("Error creating signed URL:", error);
      }

      signedResumeUrl = data?.signedUrl ?? null;
    }
  }

  const applicantName = user?.name || "Unknown Applicant";

  if (!application) {
    return (
      <div className="flex-1 w-full flex flex-col gap-6 p-6">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/protected/org/${orgId}/opening/${openingId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Opening
          </Link>
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
    <div className="flex-1 w-full max-w-5xl flex flex-col gap-6">
      <Link
        href={`/protected/org/${orgId}/opening/${openingId}`}
        className="flex items-center gap-2 w-fit text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Opening
      </Link>

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
                <p className="text-xl font-semibold">{applicantName}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{user?.net_id || "N/A"}</span>
                  <span>•</span>
                  <span>{user?.email || "N/A"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <p className="text-lg font-semibold">{application.status}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Applied Date
                </p>
                <p>{formatDate(application.created_at)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Last Updated
                </p>
                <p>{formatDate(application.updated_at)}</p>
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
              {application.form_responses &&
              typeof application.form_responses === "object" ? (
                <div className="space-y-3">
                  {Object.entries(application.form_responses).map(
                    ([key, value]) => (
                      <div key={key} className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground capitalize">
                          {key}
                        </p>
                        <p className="text-sm">{String(value)}</p>
                      </div>
                    ),
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
            resumeUrl={signedResumeUrl}
            applicantName={applicantName}
          />
        </div>
      </div>
    </div>
  );
}
