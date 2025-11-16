"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

interface UploadDialogProps {
  openingId: string;
}

export default function UploadDialog({ openingId }: UploadDialogProps) {
  const [isUploaded, setIsUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadCSV = async (file: File, endpoint: string) => {
    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/csv',
          'X-Opening-Id': openingId, // Pass opening_id in header
        },
        body: file
      });

      const result = await response.json();

      if (!response.ok) {
        // Include error details if available
        let errorMessage = result.error || 'Upload failed';
        if (result.details && Array.isArray(result.details)) {
          errorMessage += '\n\nDetails:\n' + result.details.slice(0, 10).map((d: any) => {
            // Handle different error formats
            if (d.message) {
              // PapaParse error format
              return `Row ${d.row !== undefined ? d.row : '?'}: ${d.message} (${d.type})`;
            } else if (d.error) {
              // Our custom error format
              return `Row ${d.row}: ${d.error}${d.netid ? ` (netid: ${d.netid})` : ''}`;
            } else {
              return `Row ${d.row}: ${JSON.stringify(d)}`;
            }
          }).join('\n');

          if (result.details.length > 10) {
            errorMessage += `\n... and ${result.details.length - 10} more errors`;
          }
        }
        throw new Error(errorMessage);
      }

      return result;
    } catch (err) {
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChangeInterview = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setFileName(file.name);
        await uploadCSV(file, "/api/interviews");
        setIsUploaded(true);
        setError(null);
      } catch (error) {
        console.error("Couldn't upload file: ", error);
        setError(error instanceof Error ? error.message : "Upload failed");
      }
    }
  };

  const handleFileChangeApplications = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setFileName(file.name);
        const result = await uploadCSV(file, "/api/applications");
        console.log("Upload successful! Result:", result);
        setIsUploaded(true);
        setError(null);
      } catch (error) {
        console.error("Couldn't upload file: ", error);
        setError(error instanceof Error ? error.message : "Upload failed");
      }
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      // Reset state when dialog closes
      setIsUploaded(false);
      setFileName("");
      setError(null);
      setIsUploading(false);

      // Refresh the page to show new data
      if (isUploaded) {
        window.location.reload();
      }
    }
  };

  return (
    <Dialog onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Upload className="mr-2 h-4 w-4" />
          Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        {error ? (
          <div className="flex flex-col items-center gap-4 max-h-[500px] overflow-y-auto">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <DialogTitle>Upload Failed</DialogTitle>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap text-left w-full max-w-md">{error}</pre>
            <Button onClick={() => setError(null)}>Try Again</Button>
          </div>
        ) : isUploaded ? (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <DialogTitle>Upload Successful!</DialogTitle>
            <p className="text-sm text-gray-600">File "{fileName}" has been uploaded!</p>
          </div>
        ) : (
          <>
            <DialogTitle>Upload new data</DialogTitle>
            <DialogDescription>
              Upload new form responses and interview notes here.
              CSV should have netid and resume columns, plus any custom question columns.
            </DialogDescription>
            <Button asChild size="lg" disabled={isUploading}>
              <label htmlFor="interviews-upload" style={{ cursor: isUploading ? 'not-allowed' : 'pointer'}}>
                {isUploading ? "Uploading..." : "Upload Interview Feedback"}
              </label>
            </Button>
            <input
              type="file"
              id="interviews-upload"
              onChange={handleFileChangeInterview}
              accept=".csv,.txt"
              style={{ display: 'none' }}
              disabled={isUploading}
            />
            <Button asChild size="lg" disabled={isUploading}>
              <label htmlFor="applications-upload" style={{ cursor: isUploading ? 'not-allowed' : 'pointer'}}>
                {isUploading ? "Uploading..." : "Upload Applications"}
              </label>
            </Button>
            <input
              type="file"
              id="applications-upload"
              onChange={handleFileChangeApplications}
              accept=".csv,.txt"
              style={{ display: 'none' }}
              disabled={isUploading}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
