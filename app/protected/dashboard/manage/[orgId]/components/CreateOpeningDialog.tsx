/**
 * CreateOpeningDialog Component
 *
 * Dialog for creating new job openings
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatOpeningDescription } from "@/lib/opening-utils";

interface CreateOpeningDialogProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOpeningDialog({
  orgId,
  open,
  onOpenChange,
}: CreateOpeningDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      
      // Format description with embedded deadline
      const formattedDescription = formatOpeningDescription(
        formData.description,
        formData.deadline
      );
      
      const { error } = await supabase
        .from('openings')
        .insert({
          org_id: orgId,
          title: formData.title,
          description: formattedDescription,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Opening created successfully",
      });

      // Reset form and close dialog
      setFormData({ title: '', description: '', deadline: '' });
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error('Error creating opening:', error);
      toast({
        title: "Error",
        description: "Failed to create opening",
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
            <DialogTitle>Create New Opening</DialogTitle>
            <DialogDescription>
              Add a new job opening for your organization
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Position Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g. Software Engineer, Marketing Lead"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the role and responsibilities"
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deadline">Application Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
                required
              />
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
              Create Opening
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
