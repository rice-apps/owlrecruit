/**
 * OpeningDetailsDialog Component
 *
 * Modal that displays full details of a job opening and allows users to apply.
 */
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, Briefcase } from "lucide-react";

interface Opening {
  id: string;
  org_id: string;
  title: string;
  description?: string;
  orgs:
    | {
        id: string;
        name: string;
        description?: string;
      }[]
    | null;
}

interface OpeningDetailsDialogProps {
  opening: Opening;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpeningDetailsDialog({
  opening,
  open,
  onOpenChange,
}: OpeningDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{opening.title}</DialogTitle>
              <DialogDescription className="sr-only">
                Job opening details for {opening.title} at{" "}
                {opening.orgs?.[0]?.name || "Unknown Organization"}
              </DialogDescription>
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{opening.orgs?.[0]?.name || "Unknown Organization"}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Organization Description - only shown if org has a description */}
          {opening.orgs?.[0]?.description && (
            <div>
              <h3 className="font-semibold mb-2">About the Organization</h3>
              <p className="text-sm text-muted-foreground">
                {opening.orgs?.[0]?.description}
              </p>
            </div>
          )}

          {/* Position Description - whitespace-pre-wrap preserves line breaks */}
          <div>
            <h3 className="font-semibold mb-2">Position Description</h3>
            {opening.description ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {opening.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No description provided
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          <Button className="w-full sm:w-auto">Apply Now</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
