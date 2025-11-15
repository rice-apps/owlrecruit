/**
 * QuickActions Component
 *
 * Provides quick navigation to key admin features
 */
'use client';

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Upload, FileSpreadsheet } from "lucide-react";

interface QuickActionsProps {
  orgId: string;
}

export function QuickActions({ orgId }: QuickActionsProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Navigate to key features and tools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <Button
            onClick={() => router.push(`/protected/dashboard/clubs/admin/${orgId}`)}
            className="h-auto flex-col gap-2 py-6"
            size="lg"
          >
            <LayoutDashboard className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold">Kanban Board</div>
              <div className="text-xs opacity-90">
                Manage applicant status
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => {/* TODO: Add upload functionality */}}
            className="h-auto flex-col gap-2 py-6"
            size="lg"
            disabled
          >
            <Upload className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold">Upload Applications</div>
              <div className="text-xs opacity-70">
                Import from CSV
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => {/* TODO: Add export functionality */}}
            className="h-auto flex-col gap-2 py-6"
            size="lg"
            disabled
          >
            <FileSpreadsheet className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold">Export Data</div>
              <div className="text-xs opacity-70">
                Download reports
              </div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
