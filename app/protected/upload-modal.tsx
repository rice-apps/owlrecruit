"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../../components/ui/button";
import { uploadCSV } from "../api/upload/upload-csv";
import { Upload, CheckCircle, Check } from "lucide-react";
import { useState } from "react";

export default function UploadDialog() {
  const [isUploaded, setIsUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const handleFileChangeInterview = async (e: any) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setFileName(file.name);
        await uploadCSV(file, "/api/interviews");
        setIsUploaded(true);
      } catch (error) {
        console.error("Couldn't read file: ", error);
      }
    }
  };
  const handleFileChangeApplications = async (e: any) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setFileName(file.name);
        await uploadCSV(file, "/api/applications");
        setIsUploaded(true);
      } catch (error) {
        console.error("Couldn't read file: ", error);
      }
    }
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg">
          <Upload />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent>
        {isUploaded ? (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <DialogTitle>Upload Successful!</DialogTitle>
            <p className="text-sm text-gray-600">
              File "{fileName}" has been uploaded!
            </p>
          </div>
        ) : (
          // This is where the new insertions to the table should show up, with a checkbox for each line
          <>
            <DialogTitle>Upload new data</DialogTitle>
            <DialogDescription>
              Upload new form responses and interview notes here.
            </DialogDescription>
            <Button asChild size="lg">
              <label htmlFor="interviews-upload" style={{ cursor: "pointer" }}>
                Upload Interview Feedback
              </label>
            </Button>
            <input
              type="file"
              id="interviews-upload"
              onChange={handleFileChangeInterview}
              accept=".csv,.txt"
              style={{ display: "none" }}
            />
            <Button asChild size="lg">
              <label
                htmlFor="applications-upload"
                style={{ cursor: "pointer" }}
              >
                Upload Applications
              </label>
            </Button>
            <input
              type="file"
              id="applications-upload"
              onChange={handleFileChangeApplications}
              accept=".csv,.txt"
              style={{ display: "none" }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
