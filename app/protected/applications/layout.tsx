/**
 * Dashboard Layout Component
 *
 * Server-side layout that wraps all dashboard pages with authentication checks.
 * Redirects unauthenticated users to login page before rendering dashboard content.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Verify user authentication before rendering dashboard
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return <div className="flex-1 w-full flex flex-col gap-12">{children}</div>;
}
