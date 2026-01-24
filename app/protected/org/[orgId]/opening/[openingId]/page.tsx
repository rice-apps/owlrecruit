/**
 * Opening Overview Page
 *
 * Displays opening details with tabs for Applicants, Questions, Overview, and Upload.
 */

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpeningStatusBadge } from "@/components/status-badge";
import { OpeningTabs } from "./components/OpeningTabs";
import { ApplicantsList } from "./components/ApplicantsList";
import type { ApplicationStatus } from "@/types/app";

interface OpeningOverviewPageProps {
  params: Promise<{ orgId: string; openingId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

interface ApplicationRow {
  id: string;
  status: string;
  applicant_id: string;
  users_id: string | null;
  user: {
    id: string;
    name: string;
    net_id: string;
    email: string;
  } | null;
  applicant: {
    id: string;
    net_id: string;
    name: string;
  } | null;
}

export default async function OpeningOverviewPage({
  params,
  searchParams,
}: OpeningOverviewPageProps) {
  const { orgId, openingId } = await params;
  const { tab = "applicants" } = await searchParams;
  const supabase = await createClient();

  // Fetch the organization name
  const { data: orgData } = await supabase
    .from("orgs")
    .select("name")
    .eq("id", orgId)
    .single();

  // Fetch the opening details
  const { data: openingData } = await supabase
    .from("openings")
    .select("title, description, status")
    .eq("id", openingId)
    .single();

  // Fetch applications with user data for this specific opening
  const { data: applications, error: appError } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      applicant_id,
      users_id,
      user:users_id (
        id,
        name,
        net_id,
        email
      ),
      applicant:applicant_id (
        id,
        net_id,
        name
      )
    `,
    )
    .eq("opening_id", openingId) as { data: ApplicationRow[] | null; error: any };

  // Transform applications to applicants list format
  // Prefer user info if users_id is not empty, otherwise use applicant info
  const applicants = (applications || [])
    .map((app) => {
      const userData = app.user || app.applicant;
      if (!userData) return null;
      
      return {
        id: app.applicant_id,
        name: userData.name || 'Unknown',
        email: app.user?.email || `${userData.net_id}@rice.edu`,
        netId: userData.net_id || '',
        status: (app.status || "No Status") as ApplicationStatus,
        applicationId: app.id,
      };
    })
    .filter((app) => app !== null) as Array<{
      id: any;
      name: any;
      email: any;
      netId: any;
      status: ApplicationStatus;
      applicationId: any;
    }>;

  const renderTabContent = () => {
    switch (tab) {
      case "applicants":
        return (
          <ApplicantsList
            applicants={applicants}
            orgId={orgId}
            openingId={openingId}
          />
        );
      case "questions":
        return (
          <div className="py-12 text-center text-gray-500">
            <p>Question configuration coming soon.</p>
          </div>
        );
      case "overview":
        return (
          <div className="py-8 space-y-4">
            <h3 className="font-semibold text-lg">Description</h3>
            <p className="text-gray-600">
              {openingData?.description || "No description provided."}
            </p>
          </div>
        );
      case "upload":
        return (
          <div className="py-12 text-center text-gray-500">
            <p>Upload functionality coming soon.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 w-full max-w-5xl flex flex-col gap-6">
      {/* Back link */}
      <Link
        href={`/protected/org/${orgId}`}
        className="flex items-center gap-2 w-fit text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Openings
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{orgData?.name}</p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {openingData?.title || "Untitled Opening"}
            </h1>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-gray-600 mt-2 max-w-2xl">
            {openingData?.description}
          </p>
        </div>
        <OpeningStatusBadge status={openingData?.status || "draft"} />
      </div>

      {/* Tabs */}
      <Suspense fallback={<div className="h-12" />}>
        <OpeningTabs />
      </Suspense>

      {/* Tab content */}
      <div className="flex-1">{renderTabContent()}</div>
    </div>
  );
}
