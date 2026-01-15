"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OpeningStatusBadge } from "@/components/status-badge";

interface Opening {
  id: string;
  org_id: string;
  title: string | null;
  description: string | null;
  orgs:
    | {
        id: string;
        name: string;
        description: string | null;
      }[]
    | null;
}

interface OpeningsGridProps {
  openings: Opening[];
}

export function OpeningsGrid({ openings }: OpeningsGridProps) {
  if (openings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No openings available at this time.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {openings.map((opening) => {
        const org = opening.orgs?.[0];
        return (
          <Link
            key={opening.id}
            href={`/protected/discover/${opening.org_id}?opening=${opening.id}`}
          >
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    {opening.title || "Untitled Opening"}
                  </CardTitle>
                  <OpeningStatusBadge status="open" />
                </div>
                {org && (
                  <p className="text-sm text-muted-foreground">{org.name}</p>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {opening.description || "No description provided."}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
