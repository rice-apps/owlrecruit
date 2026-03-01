"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SearchMd, Sliders01, ChevronRight } from "@untitled-ui/icons-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
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
        <SearchMd className="text-gray-400 ml-2" />
        <Input
          placeholder="Search organizations, positions..."
          className="border-0 shadow-none focus-visible:ring-0 text-base"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button variant="ghost" size="icon">
          <Sliders01 className="w-5 h-5 text-gray-500" />
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
                className="flex flex-col h-full hover:shadow-md transition-shadow"
              >
                <CardHeader className="p-4 pb-2 space-y-2">
                  {/* Logo Placeholder - random color or just org initial */}
                  <div className="w-12 h-12 rounded-lg bg-pink-600 flex items-center justify-center text-white font-bold text-xl mb-1">
                    {opening.org.name.charAt(0)}
                  </div>

                  <div>
                    <h3 className="font-bold text-lg leading-tight">
                      {opening.title}
                    </h3>
                    <p className="text-sm text-gray-500">{opening.org.name}</p>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-grow">
                  <Badge variant="secondary" className="mt-2">
                    Open
                  </Badge>
                </CardContent>
                <CardFooter className="p-4 border-t text-xs text-gray-400 flex justify-between items-center">
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
                    size="sm"
                    asChild
                    className="h-8 w-8 p-0 rounded-full"
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
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
