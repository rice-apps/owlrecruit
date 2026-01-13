"use client";

import { uploadCSV } from "../api/upload/upload-csv";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileUp, Building2 } from "lucide-react";
import Link from "next/link";

export default function ApplicationUpload() {
  const handleFileChangeInterview = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files[0];
    if (file) {
      try {
        await uploadCSV(file, "/api/interviews");
      } catch (error) {
        console.error("Couldn't read file: ", error);
      }
    }
  };
  const handleFileChangeApplications = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files[0];
    if (file) {
      try {
        await uploadCSV(file, "/api/applications");
      } catch (error) {
        console.error("Couldn't read file: ", error);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-bold text-3xl mb-2">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Manage organizations and upload data
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Organizations Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organizations
            </CardTitle>
            <CardDescription>
              Manage organization settings, openings, and team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/protected/dashboard">View My Organizations</Link>
            </Button>
          </CardContent>
        </Card>

        {/* CSV Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Data Import
            </CardTitle>
            <CardDescription>
              Upload interview feedback and application data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild size="lg" className="w-full">
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
            <Button asChild size="lg" variant="outline" className="w-full">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
