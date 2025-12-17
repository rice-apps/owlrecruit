/**
 * Dashboard Main Page
 *
 * Main dashboard view that displays user's club status, recent activity, and quick actions.
 * Includes authentication verification and user-specific content rendering.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClubStatusCard } from "./components";

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
    <div className="flex-1 w-full flex flex-col gap-12">
      {/* Dashboard Header */}
      <div className="flex flex-col gap-2 items-start">
        <h1 className="font-bold text-3xl mb-4">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your OwlRecruit dashboard. Manage your applications and
          recruitment activities here.
        </p>
      </div>

      {/* Main Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User's Club Status Card */}
        <ClubStatusCard userId={userId} />

        {/* Quick Actions and Activity Panel */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4">
            {/* Recent Activity Placeholder */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Recent Activity</h3>
              <p className="text-sm text-muted-foreground">
                Your recent club activities and updates will appear here.
              </p>
            </div>
            {/* Notifications Placeholder */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Stay updated with your application status and club
                announcements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
