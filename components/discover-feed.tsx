"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  // deadline
  closes_at?: string;
}

const COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
];

function getOrgColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
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
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
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
              <Card
                key={opening.id}
                className="flex flex-col h-full overflow-hidden relative bg-white border-gray-200"
              >
                {/* Colored Banner */}
                <div
                  className={`h-24 w-full ${getOrgColor(opening.org.name)}`}
                />

                <div className="px-5 pb-5 flex flex-col flex-grow">
                  {/* Logo - Overlapping Banner */}
                  <div className="-mt-8 w-16 h-16 rounded-xl bg-white p-1 shadow-sm mb-3">
                    <div className="w-full h-full rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 font-bold text-2xl uppercase border">
                      {/* We could use an Image here if available, fallback to initial */}
                      {opening.org.name.charAt(0)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow space-y-1">
                    <h3 className="font-bold text-lg leading-tight text-gray-900">
                      {opening.title}
                    </h3>
                    <p className="text-sm font-medium text-gray-600">
                      {opening.org.name}
                    </p>

                    {/* Status Pill */}
                    <div className="pt-2">
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-600 font-normal hover:bg-gray-100"
                      >
                        Open
                      </Badge>
                    </div>
                  </div>

                  {/* Footer / Due Date + Link */}
                  <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 font-medium flex justify-between items-center">
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

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-cyan-600"
                      asChild
                    >
                      <Link
                        href={opening.application_link || "#"}
                        target={opening.application_link ? "_blank" : undefined}
                        rel={
                          opening.application_link
                            ? "noopener noreferrer"
                            : undefined
                        }
                      >
                        <ExternalLink size={16} />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
