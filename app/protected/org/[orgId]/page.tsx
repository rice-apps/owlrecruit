/**
 * Reviewer Organization Page
 *
 * Displays all openings for a specific organization for reviewers.
 * Admins can create new openings.
 */

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OpeningFormDialog } from "@/components/opening-form-dialog";
import { OpeningStatusBadge } from "@/components/status-badge";

interface ReviewerOrgPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function ReviewerOrgPage({
  params,
}: ReviewerOrgPageProps) {
  const { orgId } = await params;
  const supabase = await createClient();

  // Verify user authentication and get their role
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  // Check if user is admin of this org
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .single();

  const isAdmin = membership?.role === "admin";

  // Fetch the organization name
  const { data: orgData } = await supabase
    .from("orgs")
    .select("name, description")
    .eq("id", orgId)
    .single();

  // Fetch all openings for this organization
  const { data: openings } = await supabase
    .from("openings")
    .select("id, title, description, status, closes_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  return (
    <div className="flex-1 w-full max-w-5xl flex flex-col gap-6">
      <Link
        href="/protected"
        className="flex items-center gap-2 w-fit text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Header with Create Button */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {orgData?.name || "Organization"}
          </h1>
          {orgData?.description && (
            <p className="text-lg text-gray-500 mt-2">{orgData.description}</p>
          )}
        </div>
        {isAdmin && (
          <OpeningFormDialog
            orgId={orgId}
            orgName={orgData?.name || "Organization"}
          />
        )}
      </div>

      {/* Openings Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {openings && openings.length > 0 ? (
          openings.map((opening) => (
            <Link
              key={opening.id}
              href={`/protected/org/${orgId}/opening/${opening.id}`}
            >
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      {opening.title || "Untitled Opening"}
                    </CardTitle>
                    <OpeningStatusBadge status={opening.status || "draft"} />
                  </div>
                  {opening.closes_at && (
                    <p className="text-xs text-gray-400">
                      Due:{" "}
                      {new Date(opening.closes_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </CardHeader>
                {opening.description && (
                  <CardContent>
                    <p className="text-sm text-gray-500 line-clamp-3">
                      {opening.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              No Openings Yet
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {isAdmin
                ? "Create your first opening to start recruiting."
                : "There are no openings for this organization yet."}
            </p>
            {isAdmin && (
              <OpeningFormDialog
                orgId={orgId}
                orgName={orgData?.name || "Organization"}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
