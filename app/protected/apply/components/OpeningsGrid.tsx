/**
 * OpeningsGrid Component
 *
 * Client component that displays job openings and handles opening detail modal.
 */
'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Building2 } from "lucide-react";
import { OpeningDetailsDialog } from "./OpeningDetailsDialog";

interface Opening {
  id: string;
  org_id: string;
  title: string;
  description?: string;
  orgs: {
    id: string;
    name: string;
    description?: string;
  } | null;
}

interface OpeningsGridProps {
  openings: Opening[];
}

export function OpeningsGrid({ openings }: OpeningsGridProps) {
  // Track which opening is selected for the details modal
  const [selectedOpening, setSelectedOpening] = useState<Opening | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Open modal with selected opening's details
  const handleOpenDetails = (opening: Opening) => {
    setSelectedOpening(opening);
    setDialogOpen(true);
  };

  if (!openings || openings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No job openings available at this time.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Check back later for new opportunities!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {openings.map((opening) => (
          <Card key={opening.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl mb-2">{opening.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{opening.orgs?.name || 'Unknown Organization'}</span>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleOpenDetails(opening)}
              >
                View Details & Apply
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Opening Details Dialog */}
      {selectedOpening && (
        <OpeningDetailsDialog
          opening={selectedOpening}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </>
  );
}
