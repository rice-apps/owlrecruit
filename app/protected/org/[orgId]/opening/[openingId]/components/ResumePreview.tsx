import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";

interface ResumePreviewProps {
  resumeUrl: string | null;
  applicantName?: string;
}

export function ResumePreview({ resumeUrl, applicantName }: ResumePreviewProps) {
  // Handle case where resume_url is null
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

  // TODO: Integrate actual PDF viewer or iframe
  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log("Download resume:", resumeUrl);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume {applicantName && `- ${applicantName}`}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* TODO: Replace with actual PDF viewer or iframe */}
        <div className="border rounded-md h-96 bg-muted flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Resume preview coming soon</p>
            <p className="text-sm mt-2">URL: {resumeUrl}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
