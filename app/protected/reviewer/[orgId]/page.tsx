/**
 * Reviewer Organization Page
 *
 * Displays all openings for a specific organization for reviewers.
 */

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Opening {
  id: string;
  title: string;
  description: string;
}

interface ReviewerOrgPageProps {
  params: { orgId: string };
}

export default async function ReviewerOrgPage({
  params,
}: ReviewerOrgPageProps) {
  const { orgId } = await params;
  const supabase = await createClient();

  // Fetch the organization name
  const { data: orgData } = await supabase
    .from("orgs")
    .select("name, description")
    .eq("id", orgId)
    .single();

  // Fetch all openings for this organization
  const { data: openings, error } = await supabase
    .from("openings")
    .select("id, title, description")
    .eq("org_id", orgId)
    .order("title");

  return (
    <div className="flex-1 w-screen max-w-5xl flex flex-col gap-6">
      <Link
        href="/protected/reviewer"
        className="flex items-center gap-2 w-fit text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Organizations
      </Link>

      <div>
        <h1 className="text-3xl font-bold">
          {orgData?.name || "Organization"} - Openings
        </h1>
        {orgData?.description && (
          <p className="text-lg text-muted-foreground mt-2">
            {orgData.description}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {openings && openings.length > 0 ? (
          openings.map((opening) => (
            <Link
              key={opening.id}
              href={`/protected/reviewer/${orgId}/opening/${opening.id}`}
            >
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{opening.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Opening ID: {opening.id}
                  </CardDescription>
                </CardHeader>
                {opening.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {opening.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No Openings Found
            </h3>
            <p className="text-sm text-muted-foreground">
              There are no openings for this organization yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
