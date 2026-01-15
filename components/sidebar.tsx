"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, Plus, HelpCircle, LogOut, ChevronLeft } from "lucide-react";
import { OrgFormDialog } from "@/components/org-form-dialog";
import type { OrgWithRole } from "@/types/app";

interface SidebarProps {
  orgs: OrgWithRole[];
  user: {
    name: string;
    email: string;
  };
}

export function Sidebar({ orgs, user }: SidebarProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const pathname = usePathname();

  // Extract current org ID from pathname if on an org page
  const currentOrgId = React.useMemo(() => {
    const match = pathname.match(/\/reviewer\/([^/]+)/);
    return match?.[1] || null;
  }, [pathname]);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-200",
        isExpanded ? "w-64" : "w-16",
      )}
    >
      {/* Header with toggle */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Organizations List */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {orgs.map((org) => (
            <li key={org.id}>
              <Link
                href={`/protected/reviewer/${org.id}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  currentOrgId === org.id
                    ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                    : "hover:bg-gray-100 text-gray-700",
                )}
              >
                {/* Org Icon/Avatar Placeholder */}
                <div className="w-8 h-8 rounded-md bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                  {org.name.charAt(0).toUpperCase()}
                </div>
                {isExpanded && (
                  <span className="truncate text-sm font-medium">
                    {org.name}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Add New Organization Button */}
        {isExpanded ? (
          <div className="mt-4">
            <OrgFormDialog
              trigger={
                <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white">
                  <Plus size={16} className="mr-2" />
                  Add new organization
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-4">
            <OrgFormDialog
              trigger={
                <button className="flex items-center justify-center w-10 h-10 mx-auto bg-cyan-500 hover:bg-cyan-600 text-white rounded-md transition-colors">
                  <Plus size={16} />
                </button>
              }
            />
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-2">
        {/* Help Link */}
        <Link
          href="/help"
          className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <HelpCircle size={20} />
          {isExpanded && <span className="text-sm">Help</span>}
        </Link>

        {/* User Profile */}
        <div className="flex items-center gap-3 px-3 py-2 mt-1">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2 w-full text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <LogOut size={20} />
            {isExpanded && <span className="text-sm">Sign out</span>}
          </button>
        </form>
      </div>
    </aside>
  );
}
