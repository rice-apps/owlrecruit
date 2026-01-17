/**
 * Organization Overview Page
 *
 * Displays organization details with Description, Openings, and Members sections
 */

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpeningFormDialog } from "@/components/opening-form-dialog";
import { OpeningStatusBadge } from "@/components/status-badge";

interface OrgPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function OrgPage({ params }: OrgPageProps) {
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

  // Fetch the organization details
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

  // Fetch all members for this organization
  const { data: members } = await supabase
    .from("org_members")
    .select(
      `
      id,
      role,
      users:user_id (
        id,
        name,
        email
      )
    `,
    )
    .eq("org_id", orgId);

  return (
    <div className="flex-1 w-full max-w-6xl flex flex-col gap-6">
      <Link
        href="/protected"
        className="flex items-center gap-2 w-fit text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Header with Edit Button and Create Opening Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold">
            {orgData?.name || "Organization"}
          </h1>
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
        {isAdmin && (
          <OpeningFormDialog
            orgId={orgId}
            orgName={orgData?.name || "Organization"}
            trigger={
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                Create new opening
              </Button>
            }
          />
        )}
      </div>

      {/* Hero Banner */}
      <div className="relative w-full h-48 bg-gradient-to-r from-cyan-100 via-blue-100 to-purple-100 rounded-2xl overflow-hidden">
        {/* Placeholder for banner image */}
        <div className="absolute inset-0 bg-gray-200" />
      </div>

      {/* About Section */}
      <div className="py-6">
        <h3 className="text-lg font-semibold mb-4">ABOUT</h3>
        <p className="text-gray-700 leading-relaxed">
          {orgData?.description ||
            "No description available for this organization."}
        </p>
      </div>

      {/* Openings Section */}
      <div className="py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">OPENINGS</h3>
          {isAdmin && openings && openings.length > 0 && (
            <Link
              href={`/protected/org/${orgId}`}
              className="text-cyan-500 hover:text-cyan-600 text-sm"
            >
              Edit openings
            </Link>
          )}
        </div>
        {openings && openings.length > 0 ? (
          <div className="space-y-3">
            {openings.map((opening) => (
              <Link
                key={opening.id}
                href={`/protected/org/${orgId}/opening/${opening.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-6 border rounded-xl hover:shadow-md transition-all bg-white">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold">
                        {opening.title || "Untitled Opening"}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <span className="uppercase">Due Date:</span>
                      <span>
                        {opening.closes_at
                          ? new Date(opening.closes_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "No due date"}
                      </span>
                    </div>
                  </div>
                  <OpeningStatusBadge status={opening.status || "draft"} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No openings yet.</p>
            {isAdmin && (
              <div className="mt-4">
                <OpeningFormDialog
                  orgId={orgId}
                  orgName={orgData?.name || "Organization"}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Members Section */}
      <div className="py-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">MEMBERS</h3>
          {isAdmin && (
            <Link
              href={`/protected/org/${orgId}`}
              className="text-cyan-500 hover:text-cyan-600 text-sm"
            >
              Edit members
            </Link>
          )}
        </div>
        {members && members.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {members.map((member) => {
              const user = Array.isArray(member.users)
                ? member.users[0]
                : member.users;
              const name = user?.name || "Unknown User";
              const initials = name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-4 border rounded-xl bg-white"
                >
                  <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-semibold">
                    {initials}
                  </div>
                  <p className="font-medium">{name}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No members yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
