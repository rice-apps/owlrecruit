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
  opening_status?: Enums<"opening_status">;
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
    // Active if not rejected/accepted offer, opening is not explicitly closed, and (no due date OR due date is in the future)
    if (app.status === "Rejected" || app.status === "Accepted Offer" || app.opening_status === "closed") return false;
    if (!app.closes_at) return true;
    return new Date(app.closes_at) >= new Date();
  });

  const pastApplications = filteredApplications.filter((app) => {
    // Past if rejected/accepted offer, explicitly closed opening OR due date has passed
    if (app.status === "Rejected" || app.status === "Accepted Offer" || app.opening_status === "closed") return true;
    if (!app.closes_at) return false;
    return new Date(app.closes_at) < new Date();
  });

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      {/* Search Bar */}
      <div className="relative w-full">
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-6 pr-12 py-3 bg-transparent border border-gray-300 rounded-[30px] focus:outline-none focus:border-blue-500 text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
