/**
 * AddAdminDialog Component
 *
 * Dialog for adding new admins to the organization
 */
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddAdminDialogProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAdminDialog({
  orgId,
  open,
  onOpenChange,
}: AddAdminDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      // Look up user in users table by email to get their ID and details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, net_id, email')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        toast({
          title: "User Not Found",
          description: "No user found with that email address",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check if user is already an admin for this organization
      // Using maybeSingle() instead of single() to avoid 406 error when no record exists
      const { data: existingAdmin } = await supabase
        .from('admin')
        .select('id')
        .eq('id', userData.id)
        .eq('org_id', orgId)
        .maybeSingle();

      if (existingAdmin) {
        toast({
          title: "Already an Admin",
          description: "This user is already an admin of the organization",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check if user exists as a reviewer for this org
      const { data: existingReviewer } = await supabase
        .from('reviewers')
        .select('id')
        .eq('id', userData.id)
        .eq('org_id', orgId)
        .maybeSingle();

      // Admin table has FK constraint to reviewers table (admin.id -> reviewers.id)
      // So we must create reviewer record first if it doesn't exist
      if (!existingReviewer) {
        const { error: reviewerError } = await supabase
          .from('reviewers')
          .insert({
            id: userData.id,
            org_id: orgId,
            name: userData.name,
            net_id: userData.net_id,
            email: userData.email,
          });

        if (reviewerError) throw reviewerError;
      }

      // Now safe to insert admin record (reviewer record exists)
      const { error } = await supabase
        .from('admin')
        .insert({
          id: userData.id,
          name: userData.name,
          net_id: userData.net_id,
          email: userData.email,
          org_id: orgId,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin added successfully",
      });

      setEmail('');
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error('Error adding admin:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add admin';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Admin</DialogTitle>
            <DialogDescription>
              Add a user as an admin of your organization
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@rice.edu"
                required
              />
              <p className="text-xs text-muted-foreground">
                The user must already have an account
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
