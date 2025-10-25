/**
 * Admin Club Layout
 * 
 * Layout for admin club pages that displays the organization name in the header.
 * Fetches organization data based on the org ID from the URL params.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface AdminClubLayoutProps {
  children: React.ReactNode;
  params: { id: string };
}

export default async function AdminClubLayout({ 
  children, 
  params 
}: AdminClubLayoutProps) {
  const supabase = await createClient();
  const orgId = params.id;

  // Verify authentication
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // Fetch organization data
  const { data: org, error: orgError } = await supabase
    .from('orgs')
    .select('name')
    .eq('id', orgId)
    .single();

  if (orgError || !org) {
    redirect("/protected/dashboard");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      {/* Header with Organization Name */}
      <div className="flex flex-col gap-2 items-start">
        <h1 className="font-bold text-3xl">{org.name}</h1>
        <p className="text-muted-foreground">
          Admin Dashboard
        </p>
      </div>
      
      {/* Page Content */}
      {children}
    </div>
  );
}
