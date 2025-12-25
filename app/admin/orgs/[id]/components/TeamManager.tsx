/**
 * TeamManager Component
 *
 * Manages admins and reviewers for the organization
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Shield, UserCheck, UserX } from "lucide-react";
import { AddAdminDialog } from "./AddAdminDialog";
import { AddReviewerDialog } from "./AddReviewerDialog";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Admin {
  id: string;
  name: string;
  org_id: string;
}

interface Reviewer {
  id: string;
  org_id: string;
  name: string;
  net_id: string;
  email: string;
}

interface TeamManagerProps {
  orgId: string;
  admins: Admin[];
  reviewers: Reviewer[];
}

export function TeamManager({ orgId, admins, reviewers }: TeamManagerProps) {
  const router = useRouter();
  const [addAdminDialogOpen, setAddAdminDialogOpen] = useState(false);
  const [addReviewerDialogOpen, setAddReviewerDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    type: "admin" | "reviewer";
    id: string;
    name: string;
  } | null>(null);
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    if (!selectedItem) return;

    setRemoving(true);
    try {
      const supabase = createClient();

      if (selectedItem.type === "admin") {
        // Removing an admin: just delete from admin table (demotes them to reviewer)
        // Must filter by both id AND org_id since users can be admins of multiple orgs
        const { error } = await supabase
          .from("admin")
          .delete()
          .eq("id", selectedItem.id)
          .eq("org_id", orgId);

        if (error) throw error;
      } else {
        // Removing a reviewer: must handle FK constraint (admin.id -> reviewers.id)
        // First try to delete from admin table (ignore errors if they're not an admin)
        await supabase
          .from("admin")
          .delete()
          .eq("id", selectedItem.id)
          .eq("org_id", orgId);

        // Now safe to delete from reviewers (completely removes them from org)
        const { error } = await supabase
          .from("reviewers")
          .delete()
          .eq("id", selectedItem.id)
          .eq("org_id", orgId);

        if (error) throw error;
      }

      console.log("role removed successfully", {
        role: selectedItem.type,
        id: selectedItem.id,
        org_id: selectedItem.id,
      });

      setRemoveDialogOpen(false);
      setSelectedItem(null);
      router.refresh();
    } catch (error) {
      console.error("failed to remove role", {
        error: error,
        role: selectedItem.type,
        id: selectedItem.id,
        org_id: selectedItem.id,
      });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
          <CardDescription>
            Manage admins and reviewers for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {admins.length === 0 && reviewers.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No admins or reviewers yet. Add team members to get started.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setAddAdminDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Admin
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAddReviewerDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reviewer
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={() => setAddAdminDialogOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Admin
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAddReviewerDialogOpen(true)}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reviewer
                </Button>
              </div>

              {/* Accordion for Admins and Reviewers */}
              <Accordion type="multiple" className="w-full">
                {/* Admins Section */}
                {admins.length > 0 && (
                  <AccordionItem value="admins">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-sm">
                          <Shield className="h-3 w-3 mr-1" />
                          Admins
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ({admins.length})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {admins.map((admin) => (
                          <div
                            key={admin.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">
                                {admin.name}
                              </h3>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedItem({
                                  type: "admin",
                                  id: admin.id,
                                  name: admin.name,
                                });
                                setRemoveDialogOpen(true);
                              }}
                            >
                              <UserX className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Reviewers Section */}
                {reviewers.length > 0 && (
                  <AccordionItem value="reviewers">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-sm">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Reviewers
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ({reviewers.length})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {reviewers.map((reviewer) => (
                          <div
                            key={reviewer.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">
                                {reviewer.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {reviewer.email}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                NetID: {reviewer.net_id}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedItem({
                                  type: "reviewer",
                                  id: reviewer.id,
                                  name: reviewer.name,
                                });
                                setRemoveDialogOpen(true);
                              }}
                            >
                              <UserX className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          )}
        </CardContent>
      </Card>

      <AddAdminDialog
        orgId={orgId}
        open={addAdminDialogOpen}
        onOpenChange={setAddAdminDialogOpen}
      />

      <AddReviewerDialog
        orgId={orgId}
        open={addReviewerDialogOpen}
        onOpenChange={setAddReviewerDialogOpen}
      />

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {selectedItem?.type === "admin" ? "Admin" : "Reviewer"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedItem?.name}?
              {selectedItem?.type === "admin" &&
                " They will lose admin access to this organization."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
