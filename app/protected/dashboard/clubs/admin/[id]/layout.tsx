/**
 * Admin Club Layout
 *
 * Layout for admin club pages that displays the organization name in the header.
 * Fetches organization data based on the org ID from the URL params.
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface AdminClubLayoutProps {
  children: React.ReactNode;
  params: { id: string };
}

export default async function AdminClubLayout({
  children,
  params,
}: AdminClubLayoutProps) {
  const supabase = await createClient();
  const { id: orgId } = await params;

  // Verify authentication
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // Fetch organization data
  const { data: org, error: orgError } = await supabase
    .from("orgs")
    .select("name")
    .eq("id", orgId)
    .single();

  if (orgError || !org) {
    redirect("/protected/dashboard");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Link
          href={`/protected/dashboard/manage/${orgId}`}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Management
        </Link>
      </div>

      {/* Header with Organization Name */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-bold text-3xl">{org.name}</h1>
          <p className="text-muted-foreground">Admin Dashboard</p>
        </div>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
