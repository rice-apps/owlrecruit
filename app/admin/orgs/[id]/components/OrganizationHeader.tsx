/**
 * OrganizationHeader Component
 *
 * Displays organization information and key statistics
 */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, FileText, UserCheck } from "lucide-react";
import { OrgSettingsDialog } from "./OrgSettingsDialog";

interface OrganizationHeaderProps {
  org: {
    id: string;
    name: string;
    description?: string;
    created_at: string;
  };
  stats: {
    totalApplications: number;
    pendingApplications: number;
    totalOpenings: number;
    totalAdmins: number;
    totalReviewers: number;
    totalTeamMembers: number;
  };
}

export function OrganizationHeader({ org, stats }: OrganizationHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Organization Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold">{org.name}</CardTitle>
              {org.description && (
                <p className="text-muted-foreground mt-1">{org.description}</p>
              )}
            </div>
          </div>
          <OrgSettingsDialog org={org} />
        </CardHeader>
      </Card>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Applications
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingApplications} pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Openings
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOpenings}</div>
            <p className="text-xs text-muted-foreground">
              Recruiting positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {/* Shows unique count (people who are admins OR reviewers, no double-counting) */}
            <div className="text-2xl font-bold">{stats.totalTeamMembers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAdmins} admins, {stats.totalReviewers} reviewers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Review Rate</CardTitle>
            <Badge variant="outline" className="ml-auto">
              {stats.totalApplications > 0
                ? Math.round(
                    ((stats.totalApplications - stats.pendingApplications) /
                      stats.totalApplications) *
                      100,
                  )
                : 0}
              %
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalApplications - stats.pendingApplications}
            </div>
            <p className="text-xs text-muted-foreground">
              Applications reviewed
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
