/**
 * OpeningsManager Component
 *
 * Manages job openings - create, edit, and delete
 */
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2, Briefcase, Calendar, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateOpeningDialog } from "./CreateOpeningDialog";
import { parseOpeningDescription, formatDeadlineForDisplay } from "@/lib/opening-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Opening {
  id: string;
  org_id: string;
  title: string;
  description?: string;
}

interface OpeningsManagerProps {
  orgId: string;
  openings: Opening[];
}

export function OpeningsManager({ orgId, openings }: OpeningsManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOpening, setSelectedOpening] = useState<Opening | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!selectedOpening) return;

    setDeleting(true);
    try {
      const supabase = createClient();

      // First, check if there are any applications for this opening
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('position', selectedOpening.title);

      if (count && count > 0) {
        toast({
          title: "Cannot Delete",
          description: `This opening has ${count} application(s). Please handle them first.`,
          variant: "destructive",
        });
        setDeleteDialogOpen(false);
        setDeleting(false);
        return;
      }

      const { error } = await supabase
        .from('openings')
        .delete()
        .eq('id', selectedOpening.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Opening deleted successfully",
      });

      setDeleteDialogOpen(false);
      setSelectedOpening(null);
      router.refresh();
    } catch (error) {
      console.error('Error deleting opening:', error);
      toast({
        title: "Error",
        description: "Failed to delete opening",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Job Openings</CardTitle>
            <CardDescription>
              Manage recruiting positions for your organization
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => router.push('/protected/apply')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All Openings
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Opening
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {openings.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No openings yet. Create your first job opening to start recruiting.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Opening
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {openings.map((opening) => {
                const { description, deadline } = parseOpeningDescription(opening.description);
                
                return (
                  <div
                    key={opening.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{opening.title}</h3>
                        {deadline && (
                          <div className="flex items-center gap-1 text-xs text-primary">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDeadlineForDisplay(deadline)}</span>
                          </div>
                        )}
                      </div>
                      {description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedOpening(opening);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateOpeningDialog
        orgId={orgId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Opening</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedOpening?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
