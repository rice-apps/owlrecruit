/**
 * KanbanBoard Component
 *
 * Client component wrapper for the Kanban board that handles interactions.
 * This allows the main page to remain a server component while having interactive elements.
 * Includes drag-and-drop functionality with edit mode and save changes.
 *
 * HOW TO CUSTOMIZE:
 * - To change columns: Edit KANBAN_COLUMNS in lib/csv-upload-config.ts
 * - To change grid layout: Edit KANBAN_GRID_COLS in lib/csv-upload-config.ts
 */
"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Save, X, Edit } from "lucide-react";
import { KanbanColumn } from "./index";
import ApplicationCard from "./ApplicationCard";
import type { Application } from "../admin/[id]/page";
import { createClient } from "@/lib/supabase/client";
import { KANBAN_COLUMNS, KANBAN_GRID_COLS } from "@/lib/csv-upload-config";

interface KanbanBoardProps {
  applications: Application[];
}

export default function KanbanBoard({ applications }: KanbanBoardProps) {
  const [localApplications, setLocalApplications] =
    useState<Application[]>(applications);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeApplication, setActiveApplication] =
    useState<Application | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Prevent server-client mismatch issues by only enabling DnD on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // Kanban columns are now configured in lib/csv-upload-config.ts
  const columns = KANBAN_COLUMNS;

  const getApplicationsByStatus = (status: string): Application[] => {
    return localApplications.filter((app) => app.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const application = localApplications.find((app) => app.id === active.id);
    setActiveApplication(application || null);

    // Enter edit mode when drag starts
    if (!isEditMode) {
      setIsEditMode(true);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveApplication(null);

    if (!over) return;

    const applicationId = active.id as string;
    const newStatus = over.id as string;

    // Find the application being moved
    const application = localApplications.find(
      (app) => app.id === applicationId,
    );
    if (!application || application.status === newStatus) return;

    // Update local state
    setLocalApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? { ...app, status: newStatus, updated_at: new Date().toISOString() }
          : app,
      ),
    );

    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();

      // Get applications that have changed from original
      const changedApplications = localApplications.filter((localApp) => {
        const originalApp = applications.find(
          (origApp) => origApp.id === localApp.id,
        );
        return originalApp && originalApp.status !== localApp.status;
      });

      // Update each changed application
      for (const app of changedApplications) {
        const { error } = await supabase
          .from("applications")
          .update({
            status: app.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", app.id);

        if (error) {
          throw error;
        }
      }

      // Exit edit mode and reset unsaved changes
      setIsEditMode(false);
      setHasUnsavedChanges(false);

      // Refresh the page to get updated data
      window.location.reload();
    } catch (error) {
      console.error("Error saving changes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelChanges = () => {
    // Reset to original applications
    setLocalApplications(applications);
    setIsEditMode(false);
    setHasUnsavedChanges(false);
  };

  const handleApplicationClick = () => {
    if (!isEditMode) {
      // Handle application click - could open modal or navigate to detail view
      // console.log('Application clicked:', application);
    }
  };

  return (
    <div className="space-y-6">
      {/* Edit Mode Controls */}
      {isEditMode && (
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Edit Mode Active
            </span>
            {hasUnsavedChanges && (
              <span className="text-xs text-blue-700 dark:text-blue-300">
                • Unsaved changes
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelChanges}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveChanges}
              disabled={!hasUnsavedChanges || isSaving}
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {isClient ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${KANBAN_GRID_COLS}, minmax(0, 1fr))`,
            }}
          >
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                title={column.title}
                status={column.status}
                applications={getApplicationsByStatus(column.status)}
                onApplicationClick={handleApplicationClick}
                isEditMode={isEditMode}
                isDraggingEnabled={true}
              />
            ))}
          </div>

          <DragOverlay>
            {activeApplication ? (
              <div className="rotate-3 opacity-90">
                <ApplicationCard
                  application={activeApplication}
                  isDragging={true}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${KANBAN_GRID_COLS}, minmax(0, 1fr))`,
          }}
        >
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              title={column.title}
              status={column.status}
              applications={getApplicationsByStatus(column.status)}
              onApplicationClick={handleApplicationClick}
              isEditMode={false}
              isDraggingEnabled={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
