"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ApplicationCard,
  ApplicationWithDetails,
} from "@/components/application-card";

interface ApplicationsViewProps {
  initialApplications: ApplicationWithDetails[];
}

export function ApplicationsView({
  initialApplications,
}: ApplicationsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter based on search query
  const filteredApplications = initialApplications.filter(
    (app) =>
      app.opening.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.opening.org.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeApplications = filteredApplications.filter(
    (app) => app.status !== "Rejected" && app.status !== "Accepted Offer",
  );

  const pastApplications = filteredApplications.filter(
    (app) => app.status === "Rejected",
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Search Header */}
      <div className="flex items-center gap-4 bg-white p-2 rounded-lg border shadow-sm">
        <Search className="text-gray-400 ml-2" />
        <Input
          placeholder="Search organizations, positions..."
          className="border-0 shadow-none focus-visible:ring-0 text-base"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button variant="ghost" size="icon">
          <SlidersHorizontal size={20} className="text-gray-500" />
        </Button>
      </div>

      <div className="space-y-8">
        {/* My Applications Section */}
        <section>
          <h2 className="text-lg font-semibold mb-4">My Applications</h2>
          {activeApplications.length === 0 ? (
            <p className="text-gray-500">No active applications found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activeApplications.map((app) => (
                <div key={app.id} className="h-full">
                  <ApplicationCard application={app} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Past Applications Section */}
        {pastApplications.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4">Past Applications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pastApplications.map((app) => (
                <div key={app.id} className="h-full">
                  <ApplicationCard application={app} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
