/**
 * Admin Club Dashboard Page
 *
 * Main admin dashboard for managing a specific club/organization.
 */

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AdminClubPageProps {
  params: { id: string };
}

export default async function AdminClubPage({ params }: AdminClubPageProps) {
  const { id: orgId } = await params;

  return (
    <div className="space-y-6 flex flex-col items-center justify-center py-20">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-muted-foreground text-center max-w-md">
        This view is deprecated. Please use the modern reviewer dashboard to
        manage your openings and applicants.
      </p>
      <Button asChild>
        <Link href={`/protected/reviewer/${orgId}`}>
          Go to Reviewer Dashboard
        </Link>
      </Button>
    </div>
  );
}
