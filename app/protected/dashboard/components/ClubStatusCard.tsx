/**
 * ClubStatusCard Component
 *
 * Displays a user's club memberships and application statuses in a card format.
 * Fetches data from Supabase including memberships, applications, organizations, and roles.
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
interface ClubMembership {
  org_id: string;
  role_id: number;
  joined_at: string;
  org_name?: string;
  role_name?: string;
}

interface ClubApplication {
  org_id: string;
  status: string;
  created_at: string;
  position: string;
  org_name?: string;
}

interface ClubStatusCardProps {
  userId: string;
}

interface ClubData {
  memberships: ClubMembership[];
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
    memberships: [],
    applications: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if user has admin role for a specific organization
   */
  const isUserAdmin = (orgId: string): boolean => {
    const membership = clubData.memberships.find((m) => m.org_id === orgId);
    if (!membership) return false;

    // Check if role name contains "admin" or similar admin indicators
    const roleName = membership.role_name?.toLowerCase() || "";
    return (
      roleName.includes("admin") ||
      roleName.includes("president") ||
      roleName.includes("leader")
    );
  };

  /**
   * Handle click on membership container
   */
  const handleMembershipClick = (membership: ClubMembership) => {
    if (isUserAdmin(membership.org_id)) {
      router.push(`/protected/dashboard/clubs/admin/${membership.org_id}`);
    } else {
      router.push(`/protected/dashboard/clubs/${membership.org_id}`);
    }
  };

  /**
   * Handle click on application container
   */
  const handleApplicationClick = (application: ClubApplication) => {
    router.push(`/protected/dashboard/clubs/${application.org_id}`);
  };

  useEffect(() => {
    async function fetchClubData() {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // Fetch memberships and applications in parallel for better performance
        const [membershipsResult, applicationsResult] = await Promise.all([
          supabase
            .from("memberships")
            .select("org_id, role_id, joined_at")
            .eq("user_id", userId),
          supabase
            .from("applications")
            .select("org_id, status, created_at, position")
            .eq("applicant_id", userId)
            .neq("status", "rejected"),
        ]);

        // Log the fetched data
        console.log("Fetched club data:", {
          membershipsResult,
          applicationsResult,
          userId,
        });

        if (membershipsResult.error) {
          throw new Error(
            `Failed to fetch memberships: ${membershipsResult.error.message}`,
          );
        }
        if (applicationsResult.error) {
          throw new Error(
            `Failed to fetch applications: ${applicationsResult.error.message}`,
          );
        }

        const { data: memberships } = membershipsResult;
        const { data: applications } = applicationsResult;

        // Extract unique IDs to minimize database queries
        const orgIds = new Set([
          ...(memberships?.map((m) => m.org_id) || []),
          ...(applications?.map((a) => a.org_id) || []),
        ]);
        const roleIds = new Set(memberships?.map((m) => m.role_id) || []);

        // Fetch organization and role details in parallel, with safety checks for empty sets
        const [orgsResult, rolesResult] = await Promise.all([
          orgIds.size > 0
            ? supabase
                .from("orgs")
                .select("id, name")
                .in("id", Array.from(orgIds))
            : { data: [], error: null },
          roleIds.size > 0
            ? supabase
                .from("roles")
                .select("id, name")
                .in("id", Array.from(roleIds))
            : { data: [], error: null },
        ]);

        if (orgsResult.error) {
          throw new Error(
            `Failed to fetch organizations: ${orgsResult.error.message}`,
          );
        }
        if (rolesResult.error) {
          throw new Error(
            `Failed to fetch roles: ${rolesResult.error.message}`,
          );
        }

        // Create lookup maps for efficient name resolution
        const orgMap = new Map(
          orgsResult.data?.map((org) => [org.id, org.name]) || [],
        );
        const roleMap = new Map(
          rolesResult.data?.map((role) => [Number(role.id), role.name]) || [],
        );

        // Transform raw data to include human-readable names
        const transformedMemberships =
          memberships?.map((membership) => ({
            ...membership,
            org_name: orgMap.get(membership.org_id) || "Unknown Club",
            role_name: roleMap.get(membership.role_id) || "Unknown Role",
          })) || [];

        const transformedApplications =
          applications?.map((application) => ({
            ...application,
            org_name: orgMap.get(application.org_id) || "Unknown Club",
          })) || [];

        setClubData({
          memberships: transformedMemberships,
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
    clubData.memberships.length === 0 && clubData.applications.length === 0;

  // Render empty state when user has no club data
  if (hasNoData) {
    return (
      <StatusCard>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No club memberships or applications found.
          </p>
        </div>
      </StatusCard>
    );
  }

  // Render main content with memberships and applications
  return (
    <StatusCard>
      <div className="space-y-6">
        {/* Active Memberships Section */}
        {clubData.memberships.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-3">Memberships</h3>
            <div className="space-y-3">
              {clubData.memberships.map((membership) => (
                <div
                  key={`${membership.org_id}-${membership.role_id}`}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50 hover:border-primary/50 hover:shadow-sm"
                  onClick={() => handleMembershipClick(membership)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleMembershipClick(membership);
                    }
                  }}
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {membership.org_name || "Unknown Club"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined: {formatDate(membership.joined_at)}
                    </p>
                  </div>
                  <Badge variant="default">{membership.role_name}</Badge>
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
                    <p className="text-sm text-muted-foreground">
                      Position: {application.position || "Not specified"}
                    </p>
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
