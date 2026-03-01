"use client";

import { useState, useEffect } from "react";
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
import {
  ApplicationCard,
  ApplicationWithDetails,
} from "@/components/application-card";
import { Tables } from "@/types/app";

interface ApplicationsViewProps {
  initialApplications: ApplicationWithDetails[];
}

export function ApplicationsView({
  initialApplications,
}: ApplicationsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    openings: (Tables<"openings"> & { org: Pick<Tables<"orgs">, "name"> })[];
    orgs: Tables<"orgs">[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const response = await fetch(
            `/api/search?query=${encodeURIComponent(searchQuery)}`,
            { signal: controller.signal },
          );
          if (!response.ok) throw new Error("Search failed");
          const data = await response.json();
          setSearchResults(data);
        } catch (error: unknown) {
          if (error instanceof Error && error.name !== "AbortError") {
            console.error("Failed to fetch search results:", error);
          }
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults(null);
      }
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [searchQuery]);

  const activeApplications = initialApplications.filter(
    (app) => app.status !== "Rejected" && app.status !== "Accepted Offer",
  );

  const pastApplications = initialApplications.filter(
    (app) => app.status === "Rejected",
  );

  return (
    <div className="flex flex-col gap-6 w-full">
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

      <div className="space-y-8">
        {searchQuery ? (
          // Search Results View
          <div className="space-y-8">
            {isSearching ? (
              <div className="text-center py-10 text-gray-500">
                Searching...
              </div>
            ) : (
              <>
                {/* Organizations Results */}
                {searchResults?.orgs && searchResults.orgs.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4">
                      Organizations
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {searchResults.orgs.map((org) => (
                        <Link
                          href={`/protected/org/${org.id}`}
                          key={org.id}
                          className="block h-full"
                        >
                          <Card className="hover:shadow-md transition-shadow h-full">
                            <CardHeader className="p-4 pb-2 flex flex-row items-center gap-4 space-y-0">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                                {org.name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-bold text-base leading-tight">
                                  {org.name}
                                </h3>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {org.description || "No description provided."}
                              </p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Openings Results */}
                {searchResults?.openings &&
                  searchResults.openings.length > 0 && (
                    <section>
                      <h2 className="text-lg font-semibold mb-4">Openings</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {searchResults.openings.map((opening) => (
                          <div key={opening.id} className="h-full">
                            <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
                              <CardHeader className="p-4 pb-2 space-y-2">
                                <div className="flex justify-between items-start">
                                  <div className="w-10 h-10 rounded-lg bg-pink-600 flex items-center justify-center text-white font-bold text-lg mb-1">
                                    {opening.org?.name?.charAt(0) || "?"}
                                  </div>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Open
                                  </Badge>
                                </div>

                                <div>
                                  <h3 className="font-bold text-base leading-tight">
                                    {opening.title}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {opening.org?.name}
                                  </p>
                                </div>
                              </CardHeader>
                              <CardFooter className="p-4 pt-0 mt-auto border-t pt-4 text-xs text-gray-400 flex justify-between items-center">
                                <span>
                                  {opening.closes_at
                                    ? `Due ${new Date(
                                        opening.closes_at,
                                      ).toLocaleDateString("en-US", {
                                        month: "2-digit",
                                        day: "2-digit",
                                        year: "numeric",
                                      })}`
                                    : "No deadline"}
                                </span>
                                {opening.application_link && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    className="h-8 w-8 p-0 rounded-full"
                                  >
                                    <Link
                                      href={opening.application_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <ChevronRight className="w-4 h-4" />
                                    </Link>
                                  </Button>
                                )}
                              </CardFooter>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                {!searchResults?.orgs?.length &&
                  !searchResults?.openings?.length && (
                    <div className="text-center py-10 text-gray-500">
                      No results found for &quot;{searchQuery}&quot;.
                    </div>
                  )}
              </>
            )}
          </div>
        ) : (
          // Default: My Applications View
          <>
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
                <h2 className="text-lg font-semibold mb-4">
                  Past Applications
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pastApplications.map((app) => (
                    <div key={app.id} className="h-full">
                      <ApplicationCard application={app} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
