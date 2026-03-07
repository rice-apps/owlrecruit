/**
 * OrgStatusCard Component
 *
 * Displays a user's organization memberships and application statuses in a card format.
 * Fetches data from Supabase including memberships, applications, organizations, and roles.
 * Provides loading states, error handling, and empty state management.
 */
"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Enums } from "@/types/supabase";

// Application status type from database enum
type ApplicationStatus = Enums<"status">;

// Type definitions for org-related data structures
interface OrgMembership {
  org_id: string;
  role: Enums<"org_role">;
  created_at: string | null;
  org_name?: string;
}

interface OrgApplication {
  org_id: string;
  opening_id: string;
  status: ApplicationStatus | null;
  created_at: string | null;
  opening_title?: string;
  org_name?: string;
}

interface OrgStatusCardProps {
  userId: string;
}

interface OrgData {
  memberships: OrgMembership[];
  applications: OrgApplication[];
}

/**
 * Maps application status to appropriate badge variant for visual consistency
 */
const getStatusBadgeVariant = (
  status: ApplicationStatus | null,
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "No Status":
    case "Applied":
      return "secondary";
    case "Interviewing":
      return "default";
    case "Offer":
    case "Accepted Offer":
      return "default";
    case "Rejected":
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
      <CardTitle>Organization Status</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

export default function OrgStatusCard({ userId }: OrgStatusCardProps) {
  const router = useRouter();
  const [orgData, setOrgData] = useState<OrgData>({
    memberships: [],
    applications: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle click on membership container
   */
  const handleMembershipClick = (membership: OrgMembership) => {
    router.push(`/protected/org/${membership.org_id}`);
  };

  /**
   * Handle click on application container
   */
  const handleApplicationClick = (application: OrgApplication) => {
    router.push(`/protected/org/${application.org_id}`);
  };

  useEffect(() => {
    async function fetchOrgData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/user/org-status");
        if (!response.ok) {
          throw new Error("Failed to fetch organization data");
        }

        const data: OrgData = await response.json();
        setOrgData(data);
      } catch (err) {
        console.error("Error fetching org data:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred",
        );
      } finally {
        setLoading(false);
      }
    }

    // Only fetch data if userId is provided
    if (userId) {
      fetchOrgData();
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
          <p className="text-destructive mb-2">
            Error loading organization data
          </p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </StatusCard>
    );
  }

  const hasNoData =
    orgData.memberships.length === 0 && orgData.applications.length === 0;

  // Render empty state when user has no org data
  if (hasNoData) {
    return (
      <StatusCard>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No organization memberships or applications found.
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
        {orgData.memberships.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-3">Memberships</h3>
            <div className="space-y-3">
              {orgData.memberships.map((membership) => (
                <div
                  key={`${membership.org_id}-${membership.role}`}
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
                      {membership.org_name || "Unknown Organization"}
                    </p>
                    {membership.created_at && (
                      <p className="text-xs text-muted-foreground">
                        Joined: {formatDate(membership.created_at)}
                      </p>
                    )}
                  </div>
                  <Badge variant="default">
                    {membership.role === "admin" ? "Admin" : "Reviewer"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Applications Section */}
        {orgData.applications.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-3">Applications</h3>
            <div className="space-y-3">
              {orgData.applications.map((application) => (
                <div
                  key={`${application.opening_id}-${application.created_at}`}
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
                      {application.org_name || "Unknown Organization"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Position: {application.opening_title || "Not specified"}
                    </p>
                    {application.created_at && (
                      <p className="text-xs text-muted-foreground">
                        Applied: {formatDate(application.created_at)}
                      </p>
                    )}
                  </div>
                  <Badge variant={getStatusBadgeVariant(application.status)}>
                    {application.status ?? "No Status"}
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
