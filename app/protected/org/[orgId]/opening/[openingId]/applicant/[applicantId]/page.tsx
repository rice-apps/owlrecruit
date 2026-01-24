import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ResumePreview } from "../../components";

interface ApplicantReviewPageProps {
  params: Promise<{ orgId: string; openingId: string; applicantId: string }>;
}

export default async function ApplicantReviewPage({
  params,
}: ApplicantReviewPageProps) {
  const { orgId, openingId, applicantId } = await params;
  console.log("Page params:", { orgId, openingId, applicantId });

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Fetch the application data (applicantId here is the application ID)
  const { data: application, error: fetchError } = await supabase
    .from("applications")
    .select(
      `
      id,
      resume_url,
      status,
      applicant_id
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

  console.log("Fetched application:", application);

  // Extract the file path from the stored signed URL and generate a fresh one
  let signedResumeUrl: string | null = null;
  if (application?.resume_url) {
    console.log("Original resume_url:", application.resume_url);
    // Stored URL format: .../storage/v1/object/sign/Media_Bucket/<filepath>?token=...
    const bucketPrefix = "/storage/v1/object/sign/Media_Bucket/";
    const idx = application.resume_url.indexOf(bucketPrefix);
    if (idx !== -1) {
      const pathWithParams = application.resume_url.slice(
        idx + bucketPrefix.length,
      );
      const filePath = decodeURIComponent(pathWithParams.split("?")[0]);
      console.log("Extracted filePath:", filePath);

      const { data, error } = await adminSupabase.storage
        .from("Media_Bucket")
        .createSignedUrl(filePath, 86400); // 1 day expiration

      if (error) {
        console.error("Error creating signed URL:", error);
      }

      signedResumeUrl = data?.signedUrl ?? null;
      console.log("New signedResumeUrl:", signedResumeUrl);
    } else {
      console.log("Could not find bucket prefix in resume_url");
    }
  } else {
    console.log("No resume_url found on application");
  }

  const applicantName = user?.name || "Unknown Applicant";

  return (
    <div className="flex-1 w-full max-w-5xl flex flex-col gap-6">
      <Link
        href={`/protected/org/${orgId}/opening/${openingId}`}
        className="flex items-center gap-2 w-fit text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Opening
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{applicantName}</h1>
        {user?.email && (
          <p className="text-muted-foreground mt-1">{user.email}</p>
        )}
      </div>

      <ResumePreview resumeUrl={signedResumeUrl} applicantName={applicantName} />
    </div>
  );
}
