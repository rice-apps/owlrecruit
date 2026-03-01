"use client";

import { Button } from "@/components/ui/button";
import type { Enums } from "@/types/supabase";

export interface OrgMembership {
  id: string;
  org_id: string;
  role: Enums<"org_role">;
  org_name: string;
}

interface OrganizationsSectionProps {
  memberships: OrgMembership[];
}

export default function OrganizationsSection({
  memberships,
}: OrganizationsSectionProps) {
  // component just renders passed memberships

  const getRoleClasses = () => {
    return "text-purple-700 border-purple-700";
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Organizations
      </label>
      {memberships.length === 0 ? (
        <p className="text-gray-500 text-sm">
          You are not a member of any organizations yet.
        </p>
      ) : (
        <div className="space-y-3">
          {memberships.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-4 p-4 border border-gray-300 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-300 flex items-center justify-center text-white font-bold text-lg">
                {m.org_name.charAt(0) ?? "?"}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <h3 className="font-medium text-gray-900">
                  {m.org_name || "Unknown Organization"}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className={`${getRoleClasses()} cursor-default rounded-lg px-2 py-1 h-auto`}
                >
                  {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
