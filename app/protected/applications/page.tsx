/**
 * Dashboard Main Page
 *
 * Main dashboard view that displays user's organization status, recent activity, and quick actions.
 * Includes authentication verification and user-specific content rendering.
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OrgStatusCard } from "./components";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Verify authentication (redundant with layout but ensures security)
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // Extract user ID from JWT claims for personalized content
  const userId = data.claims.sub;

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      {/* Back Link */}
      <Link
        href="/protected"
        className="flex items-center gap-2 w-fit text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Dashboard Header */}
      <div className="flex flex-col gap-2 items-start">
        <h1 className="font-bold text-3xl mb-4">My Applications</h1>
        <p className="text-muted-foreground">
          View your organization memberships and application statuses.
        </p>
      </div>

      {/* Main Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User's Organization Status Card */}
        <OrgStatusCard userId={userId} />

        {/* Quick Actions and Activity Panel */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4">
            {/* Recent Activity Placeholder */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Recent Activity</h3>
              <p className="text-sm text-muted-foreground">
                Your recent organization activities and updates will appear
                here.
              </p>
            </div>
            {/* Notifications Placeholder */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Stay updated with your application status and organization
                announcements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
