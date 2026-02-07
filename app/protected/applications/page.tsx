/**
 * My Applications Page
 *
 * Displays user's applications as cards with position, organization, status, and due date
 * Includes active applications and past applications sections
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { ApplicationCard } from "./components";
import type { Enums } from "@/types/supabase";

type ApplicationStatus = Enums<"status">;

interface Application {
  org_id: string;
  opening_id: string;
  status: ApplicationStatus | null;
  created_at: string | null;
  opening_title?: string;
  org_name?: string;
  closes_at?: string | null;
}

interface ApplicationsData {
  applications: Application[];
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchApplications() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/user/org-status");
        if (!response.ok) {
          throw new Error("Failed to fetch applications");
        }

        const data: ApplicationsData = await response.json();
        setApplications(data.applications || []);
      } catch (err) {
        console.error("Error fetching applications:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchApplications();
  }, []);

  // Filter applications based on search query
  const filteredApplications = applications.filter((app) => {
    const query = searchQuery.toLowerCase();
    return (
      app.opening_title?.toLowerCase().includes(query) ||
      app.org_name?.toLowerCase().includes(query)
    );
  });

  // Separate active and past applications
  const activeApplications = filteredApplications.filter((app) => {
    // Active if not rejected and (no due date OR due date is in the future)
    if (app.status === "Rejected") return false;
    if (!app.closes_at) return true;
    return new Date(app.closes_at) >= new Date();
  });

  const pastApplications = filteredApplications.filter((app) => {
    // Past if rejected OR due date has passed
    if (app.status === "Rejected") return true;
    if (!app.closes_at) return false;
    return new Date(app.closes_at) < new Date();
  });

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      {/* Back Link */}
      <Link
        href="/protected"
        className="flex items-center gap-2 w-fit text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Page Header */}
      <div className="flex flex-col gap-2 items-start">
        <h1 className="font-bold text-3xl mb-4">My Applications</h1>
        <p className="text-muted-foreground">
          View and manage your application statuses.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search organizations, positions..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-destructive mb-2">Error loading applications</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      {/* Applications Content */}
      {!loading && !error && (
        <>
          {/* My Applications Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">My Applications</h2>
            {activeApplications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {activeApplications.map((app) => (
                  <ApplicationCard
                    key={`${app.opening_id}-${app.created_at}`}
                    application={app}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-8">
                {searchQuery
                  ? "No active applications match your search."
                  : "No active applications found."}
              </p>
            )}
          </div>

          {/* Past Applications Section */}
          {pastApplications.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Past Applications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pastApplications.map((app) => (
                  <ApplicationCard
                    key={`${app.opening_id}-${app.created_at}`}
                    application={app}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {activeApplications.length === 0 &&
            pastApplications.length === 0 &&
            !searchQuery && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  You haven't submitted any applications yet.
                </p>
              </div>
            )}
        </>
      )}
    </div>
  );
}
