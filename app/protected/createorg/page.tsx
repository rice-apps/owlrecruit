"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Upload } from "lucide-react";

export default function NewOrgPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Organization name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orgs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create organization");
      }

      // Force a full reload to ensure the sidebar layout updates with the new organization
      window.location.href = `/protected/org/${data.id}`;
    } catch (err) {
      console.error("Error creating organization:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create organization",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-12 py-10">
      <h1 className="text-3xl font-semibold mb-10">Create new organization</h1>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 space-y-7">
        {/* Organization Name */}
        <div className="space-y-2">
          <Label htmlFor="org-name" className="text-sm font-medium text-gray-700">
            Organization Name<span className="text-red-500">*</span>
          </Label>
          <Input
            id="org-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="h-11 text-sm w-full"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="org-description" className="text-sm font-medium text-gray-700">
            Description<span className="text-red-500">*</span>
          </Label>
          <Input
            id="org-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="h-11 text-sm w-full"
          />
        </div>

        {/* Upload logo */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Upload logo</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-md h-36 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gray-400 transition-colors bg-white">
            <Upload className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-400">Drag &amp; drop or click to upload</span>
          </div>
        </div>

        {/* Upload banner */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Upload banner</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-md h-36 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gray-400 transition-colors bg-white">
            <Upload className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-400">Drag &amp; drop or click to upload</span>
          </div>
        </div>

        {/* Invite members */}
        <div>
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-indigo-500 hover:text-indigo-600 font-medium transition-colors"
            onClick={() => alert("Waiting for Leif's implementation!")}
          >
            Invite members <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Actions — bottom right */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="px-8 h-11 text-sm"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="px-8 h-11 text-sm bg-indigo-500 hover:bg-indigo-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create organization"}
          </Button>
        </div>
      </form>
    </div>
  );
}
