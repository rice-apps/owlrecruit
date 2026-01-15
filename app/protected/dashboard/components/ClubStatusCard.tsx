/**
 * ClubStatusCard Component
 *
 * Displays a user's admin organizations and application statuses in a card format.
 * Fetches organizations where user is an admin (from admin table) and their applications.
 * Provides loading states, error handling, and empty state management.
 */
"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Type definitions for club-related data structures
interface AdminOrg {
  org_id: string;
  org_name?: string;
}

interface ClubApplication {
  org_id: string;
  status: string;
  created_at: string;
  opening_id?: string;
  org_name?: string;
  opening_title?: string;
}

interface ClubStatusCardProps {
  userId: string;
}

interface ClubData {
  adminOrgs: AdminOrg[];
  applications: ClubApplication[];
}

/**
 * Maps application status to appropriate badge variant for visual consistency
 */
const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "secondary";
    case "approved":
      return "default";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
};

/**
 * Formats ISO date string to user-friendly format (e.g., "Jan 15, 2024")
 */
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Reusable Card wrapper component to reduce code duplication
 * Provides consistent header and styling for all card states
 */
const StatusCard = ({ children }: { children: ReactNode }) => (
  <Card>
    <CardHeader>
      <CardTitle>Club Status</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

export default function ClubStatusCard({ userId }: ClubStatusCardProps) {
  const router = useRouter();
  const [clubData, setClubData] = useState<ClubData>({
    adminOrgs: [],
    applications: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle click on admin org container - routes to management page
   */
  const handleAdminOrgClick = (adminOrg: AdminOrg) => {
    router.push(`/protected/reviewer/${adminOrg.org_id}`);
  };

  /**
   * Handle click on application container - routes to club page
   */
  const handleApplicationClick = (application: ClubApplication) => {
    // If we have an opening ID, we could route to specific application view,
    // but for now, routing to the org page (discover mode) is a safe default for applicants
    router.push(`/protected/discover/${application.org_id}`);
  };

  useEffect(() => {
    async function fetchClubData() {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // Fetch organizations where user is an admin, and their applications
        // Running both queries in parallel for better performance
        const [adminOrgsResult, applicationsResult] = await Promise.all([
          supabase.from("admin").select("org_id").eq("id", userId),
          supabase
            .from("applications")
            .select(
              `
              org_id,
              status,
              created_at,
              opening_id,
              openings:opening_id (
                title
              )
            `,
            )
            .eq("applicant_id", userId),
        ]);

        // Log the fetched data
        console.log("Fetched club data:", {
          adminOrgsResult,
          applicationsResult,
          userId,
        });

        if (adminOrgsResult.error) {
          throw new Error(
            `Failed to fetch admin orgs: ${adminOrgsResult.error.message}`,
          );
        }
        if (applicationsResult.error) {
          throw new Error(
            `Failed to fetch applications: ${applicationsResult.error.message}`,
          );
        }

        const { data: adminOrgs } = adminOrgsResult;
        const { data: applications } = applicationsResult;

        // Extract unique org IDs to minimize database queries
        const orgIds = new Set([
          ...(adminOrgs?.map((a) => a.org_id) || []),
          ...(applications?.map((a) => a.org_id) || []),
        ]);

        // Fetch organization details
        const orgsResult =
          orgIds.size > 0
            ? await supabase
                .from("orgs")
                .select("id, name")
                .in("id", Array.from(orgIds))
            : { data: [], error: null };

        if (orgsResult.error) {
          throw new Error(
            `Failed to fetch organizations: ${orgsResult.error.message}`,
          );
        }

        // Create lookup map for efficient name resolution
        const orgMap = new Map(
          orgsResult.data?.map((org) => [org.id, org.name]) || [],
        );

        // Transform raw data to include human-readable names
        const transformedAdminOrgs =
          adminOrgs?.map((adminOrg) => ({
            ...adminOrg,
            org_name: orgMap.get(adminOrg.org_id) || "Unknown Club",
          })) || [];

        const transformedApplications =
          applications?.map((application) => {
            const opening = Array.isArray(application.openings)
              ? application.openings[0]
              : application.openings;

            return {
              ...application,
              org_name: orgMap.get(application.org_id) || "Unknown Club",
              opening_title: opening?.title,
            };
          }) || [];

        setClubData({
          adminOrgs: transformedAdminOrgs,
          applications: transformedApplications,
        });
      } catch (err) {
        console.error("Error fetching club data:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
      } finally {
        setLoading(false);
      }
    }

    // Only fetch data if userId is provided
    if (userId) {
      fetchClubData();
    }
  }, [userId]);

  // Render loading state with spinner
  if (loading) {
    return (
      <StatusCard>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
      </StatusCard>
    );
  }

  // Render error state with user-friendly message
  if (error) {
    return (
      <StatusCard>
        <div className="text-center py-8">
          <p className="text-destructive mb-2">Error loading club data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </StatusCard>
    );
  }

  const hasNoData =
    clubData.adminOrgs.length === 0 && clubData.applications.length === 0;

  // Render empty state when user has no club data
  if (hasNoData) {
    return (
      <StatusCard>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No admin organizations or applications found.
          </p>
        </div>
      </StatusCard>
    );
  }

  // Render main content with admin organizations and applications
  return (
    <StatusCard>
      <div className="space-y-6">
        {/* Admin Organizations Section */}
        {clubData.adminOrgs.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-3">Admin Organizations</h3>
            <div className="space-y-3">
              {clubData.adminOrgs.map((adminOrg) => (
                <div
                  key={adminOrg.org_id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50 hover:border-primary/50 hover:shadow-sm"
                  onClick={() => handleAdminOrgClick(adminOrg)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleAdminOrgClick(adminOrg);
                    }
                  }}
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {adminOrg.org_name || "Unknown Club"}
                    </p>
                  </div>
                  <Badge variant="default">Admin</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Applications Section */}
        {clubData.applications.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-3">Applications</h3>
            <div className="space-y-3">
              {clubData.applications.map((application) => (
                <div
                  key={`${application.org_id}-${application.created_at}`}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50 hover:border-primary/50 hover:shadow-sm"
                  onClick={() => handleApplicationClick(application)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleApplicationClick(application);
                    }
                  }}
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {application.org_name || "Unknown Club"}
                    </p>
                    {application.opening_title && (
                      <p className="text-sm text-muted-foreground">
                        Position: {application.opening_title}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Applied: {formatDate(application.created_at)}
                    </p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(application.status)}>
                    {application.status.charAt(0).toUpperCase() +
                      application.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </StatusCard>
  );
}
