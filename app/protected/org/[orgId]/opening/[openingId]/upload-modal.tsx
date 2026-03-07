"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload01, CheckCircle, AlertCircle } from "@untitled-ui/icons-react";
import { useState } from "react";

interface UploadDialogProps {
  openingId: string;
  orgId: string;
}

export default function UploadDialog({ openingId, orgId }: UploadDialogProps) {
  const [isUploaded, setIsUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUploadingInterview, setIsUploadingInterview] = useState(false);
  const [isUploadingApplication, setIsUploadingApplication] = useState(false);

  const uploadCSV = async (
    file: File,
    endpoint: string,
    type: "interview" | "application",
  ) => {
    if (type === "interview") setIsUploadingInterview(true);
    else setIsUploadingApplication(true);

    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/csv",
          "X-Opening-Id": openingId, // Pass opening_id in header
        },
        body: file,
      });

      const result = await response.json();

      if (!response.ok) {
        // Include error details if available
        let errorMessage = result.error || "Upload failed";
        if (result.details && Array.isArray(result.details)) {
          errorMessage +=
            "\n\nDetails:\n" +
            result.details
              .slice(0, 10)
              .map(
                (d: {
                  message?: string;
                  row?: number;
                  type?: string;
                  error?: string;
                  netid?: string;
                }) => {
                  // Handle different error formats
                  if (d.message) {
                    // PapaParse error format
                    return `Row ${d.row !== undefined ? d.row : "?"}: ${d.message} (${d.type})`;
                  } else if (d.error) {
                    // Our custom error format
                    return `Row ${d.row}: ${d.error}${d.netid ? ` (netid: ${d.netid})` : ""}`;
                  } else {
                    return `Row ${d.row}: ${JSON.stringify(d)}`;
                  }
                },
              )
              .join("\n");

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
      if (type === "interview") setIsUploadingInterview(false);
      else setIsUploadingApplication(false);
    }
  };

  const handleFileChangeInterview = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setFileName(file.name);
        const result = await uploadCSV(
          file,
          `/api/org/${orgId}/interviews`,
          "interview",
        );
        setIsUploaded(true);

        // Handle partial warnings
        if (result.errors && result.errors.length > 0) {
          const warningMessage = result.errors
            .map(
              (d: { row: number; error: string; netid?: string }) =>
                `Row ${d.row}: ${d.error}${d.netid ? ` (netid: ${d.netid})` : ""}`,
            )
            .join("\n");
          setError(warningMessage);
        } else {
          setError(null);
        }
      } catch (error) {
        console.error("Couldn't upload file: ", error);
        setError(error instanceof Error ? error.message : "Upload failed");
      }
    }
  };

  const handleFileChangeApplications = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setFileName(file.name);
        const result = await uploadCSV(
          file,
          `/api/org/${orgId}/applications`,
          "application",
        );
        console.log("Upload successful! Result:", result);
        setIsUploaded(true);

        // Handle partial warnings
        if (result.errors && result.errors.length > 0) {
          const warningMessage = result.errors
            .map(
              (d: { row: number; error: string; netid?: string }) =>
                `Row ${d.row}: ${d.error}${d.netid ? ` (netid: ${d.netid})` : ""}`,
            )
            .join("\n");
          setError(warningMessage);
        } else {
          setError(null);
        }
      } catch (error) {
        console.error("Couldn't upload file: ", error);
        setError(error instanceof Error ? error.message : "Upload failed");
      }
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      // Reload if we had a successful (or partial) upload to show new data
      if (isUploaded) {
        window.location.reload();
      }

      // Reset state when dialog closes
      setIsUploaded(false);
      setFileName("");
      setError(null);
      setIsUploadingInterview(false);
      setIsUploadingApplication(false);
    }
  };

  return (
    <Dialog onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Upload01 className="mr-2 h-4 w-4" />
          Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        {error ? (
          <div className="flex flex-col items-center gap-4 max-h-[500px] overflow-y-auto">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <DialogTitle>Upload Failed</DialogTitle>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap text-left w-full max-w-md">
              {error}
            </pre>
            <Button onClick={() => setError(null)}>Try Again</Button>
          </div>
        ) : isUploaded ? (
          <div className="flex flex-col items-center gap-4 max-h-[500px] overflow-y-auto w-full">
            {error ? (
              // Partial success (some uploaded, some failed)
              <>
                <AlertCircle className="w-12 h-12 text-yellow-500" />
                <DialogTitle>Upload Completed with Warnings</DialogTitle>
                <div className="w-full">
                  <p className="text-sm text-gray-600 mb-2 text-center">
                    Some records were uploaded, but others were skipped:
                  </p>
                  <pre className="text-xs bg-slate-100 p-4 rounded text-slate-700 whitespace-pre-wrap overflow-x-auto border border-slate-200">
                    {error}
                  </pre>
                </div>
              </>
            ) : (
              // Full success
              <>
                <CheckCircle className="w-12 h-12 text-green-500" />
                <DialogTitle>Upload Successful!</DialogTitle>
                <p className="text-sm text-gray-600">
                  File &quot;{fileName}&quot; has been uploaded!
                </p>
              </>
            )}
            <Button
              onClick={() => handleClose(false)}
              variant="outline"
              className="mt-2"
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogTitle>Upload new data</DialogTitle>
            <DialogDescription>
              Upload new form responses and interview notes here. CSV should
              have netid and resume columns, plus any custom question columns.
            </DialogDescription>
            <Button
              asChild
              size="lg"
              disabled={isUploadingInterview || isUploadingApplication}
            >
              <label
                htmlFor="interviews-upload"
                style={{
                  cursor:
                    isUploadingInterview || isUploadingApplication
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {isUploadingInterview
                  ? "Uploading..."
                  : "Upload Interview Feedback"}
              </label>
            </Button>
            <input
              type="file"
              id="interviews-upload"
              onChange={handleFileChangeInterview}
              accept=".csv,.txt"
              style={{ display: "none" }}
              disabled={isUploadingInterview || isUploadingApplication}
            />
            <Button
              asChild
              size="lg"
              disabled={isUploadingInterview || isUploadingApplication}
            >
              <label
                htmlFor="applications-upload"
                style={{
                  cursor:
                    isUploadingInterview || isUploadingApplication
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {isUploadingApplication
                  ? "Uploading..."
                  : "Upload Applications"}
              </label>
            </Button>
            <input
              type="file"
              id="applications-upload"
              onChange={handleFileChangeApplications}
              accept=".csv,.txt"
              style={{ display: "none" }}
              disabled={isUploadingInterview || isUploadingApplication}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
