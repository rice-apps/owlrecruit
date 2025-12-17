"use client";

import { uploadCSV } from "../api/upload/upload-csv";
import { Button } from "@/components/ui/button";

export default function ApplicationUpload() {
  const handleFileChangeInterview = async (e: any) => {
    const file = e.target.files[0];
    if (file) {
      try {
        await uploadCSV(file, "/api/interviews");
      } catch (error) {
        console.error("Couldn't read file: ", error);
      }
    }
  };
  const handleFileChangeApplications = async (e: any) => {
    const file = e.target.files[0];
    if (file) {
      try {
        await uploadCSV(file, "/api/interviews");
      } catch (error) {
        console.error("Couldn't read file: ", error);
      }
    }
  };

  return (
    <>
      <h2 className="font-bold text-2xl mb-4">Hey admin!</h2>
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
        <label htmlFor="applications-upload" style={{ cursor: "pointer" }}>
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
  );
}
