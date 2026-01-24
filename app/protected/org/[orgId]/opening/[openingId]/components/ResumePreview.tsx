import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";

interface ResumePreviewProps {
  resumeUrl: string | null;
  applicantName?: string;
}

export function ResumePreview({ resumeUrl, applicantName }: ResumePreviewProps) {
  if (!resumeUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 bg-muted rounded-md">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No resume available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume {applicantName && `- ${applicantName}`}
          </CardTitle>
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <iframe
          src={`${resumeUrl}#toolbar=0&navpanes=0&view=FitH`}
          title={`Resume - ${applicantName || "Applicant"}`}
          className="w-full h-[700px] rounded-md border-none"
        />
      </CardContent>
    </Card>
  );
}
