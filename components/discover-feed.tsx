"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LinkExternal01 } from "@untitled-ui/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/search-input";

interface Opening {
  id: string;
  title: string;
  description: string;
  created_at: string;
  status: "open" | "closed" | "paused";
  org_id: string;
  application_link?: string;
  org: {
    name: string;
  };
  closes_at?: string;
}

function isValidUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function DiscoverFeed() {
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchOpenings() {
      try {
        const response = await fetch("/api/openings");
        if (!response.ok) {
          throw new Error("Failed to fetch openings");
        }
        const data = await response.json();
        setOpenings(data);
      } catch (error) {
        console.error("Error fetching openings:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOpenings();
  }, []);

  const filteredOpenings = openings.filter(
    (opening) =>
      opening.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opening.org.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl">
      {/* Search Header */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search organizations, positions..."
        showFilter
      />

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Postings</h2>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : filteredOpenings.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No open roles found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOpenings.map((opening) => (
              <div
                key={opening.id}
                className="flex flex-col h-full rounded-[20px] shadow-md bg-white overflow-hidden"
              >
                {/* Pink header band */}
                <div className="bg-owl-pink rounded-t-[20px] h-16 relative">
                  <div className="absolute -bottom-5 left-4 w-12 h-12 rounded-lg bg-white flex items-center justify-center text-owl-purple font-bold text-xl shadow-sm border border-gray-100">
                    {opening.org.name.charAt(0)}
                  </div>
                </div>

                {/* Card body */}
                <div className="flex flex-col flex-grow p-4 pt-8">
                  <div>
                    <h3 className="font-bold text-lg leading-tight">
                      {opening.title}
                    </h3>
                    <p className="text-sm text-gray-500">{opening.org.name}</p>
                  </div>
                  <div className="mt-2">
                    <Badge variant="open">Open</Badge>
                  </div>
                </div>

                {/* Footer */}
                {isValidUrl(opening.application_link) ? (
                  <Link
                    href={opening.application_link!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 border-t text-xs text-gray-400 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <span>
                      {opening.closes_at
                        ? `Due ${new Date(opening.closes_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "2-digit",
                              day: "2-digit",
                              year: "numeric",
                            },
                          )}`
                        : "No deadline"}
                    </span>
                    <LinkExternal01 className="w-4 h-4 text-gray-400" />
                  </Link>
                ) : (
                  <div className="px-4 py-3 border-t text-xs text-gray-400">
                    <span>
                      {opening.closes_at
                        ? `Due ${new Date(opening.closes_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "2-digit",
                              day: "2-digit",
                              year: "numeric",
                            },
                          )}`
                        : "No deadline"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
