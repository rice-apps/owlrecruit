"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Plus, Search, Folder, Menu } from "lucide-react";
import type { OrgWithRole } from "@/types/app";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SidebarProps {
  orgs: OrgWithRole[];
  user: {
    name: string;
    email: string;
  };
}

export function Sidebar({ orgs, user }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <aside className="hidden md:flex md:flex-col h-screen w-64 bg-white border-r border-gray-200 shrink-0">
      {/* Logo */}
      <div className="p-6 pb-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-6 h-6">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-cyan-500"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                fill="currentColor"
                opacity="0.2"
              />
              <path
                d="M12 16C14 16 15.5 15 16.5 13.5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="font-bold text-xl text-cyan-500 tracking-tight">
            owlrecruit
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {/* Discover */}
        <Link
          href="/protected/discover"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
            isActive("/protected/discover")
              ? "bg-gray-100 text-gray-900"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
          )}
        >
          <Search size={18} />
          Discover
        </Link>

        {/* My Applications */}
        <Link
          href="/protected/applications"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
            isActive("/protected/applications")
              ? "bg-gray-100 text-gray-900"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
          )}
        >
          {/* Using Folder/FileText as icon for Applications */}
          <Folder size={18} />
          My Applications
        </Link>

        {/* My Organizations Accordion */}
        <Accordion
          type="single"
          collapsible
          className="w-full"
          value={isActive("/protected/org") ? "my-orgs" : undefined}
        >
          <AccordionItem value="my-orgs" className="border-none">
            <AccordionTrigger className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:no-underline decoration-0">
              <div className="flex items-center gap-3">
                <Menu size={18} />
                My Organizations
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-0 pt-1">
              <div className="flex flex-col gap-1 pl-4 border-l ml-3.5 border-gray-200">
                {orgs.map((org) => (
                  <Link
                    key={org.id}
                    href={`/protected/org/${org.id}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive(`/protected/org/${org.id}`)
                        ? "bg-gray-100 text-gray-900 font-medium"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
                    )}
                  >
                    {/* Minimal org item - maybe just name or name + tiny icon */}
                    <span className="truncate">{org.name}</span>
                  </Link>
                ))}

                <div className="px-1 pt-2">
                  <Link
                    href="/protected/createorg"
                    className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full"
                  >
                    <Plus size={14} />
                    Add new
                  </Link>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </nav>

      {/* User Profile Footer */}
      <Link 
          href="/protected/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
            isActive("/protected/profile")
              ? "bg-gray-100 text-gray-900"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
          )}
      >
        yoo

      </Link>
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 overflow-hidden">
            {/* Placeholder avatar */}
            <span className="text-sm font-medium">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </span>
            <span className="text-xs text-gray-500 truncate">{user.email}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
