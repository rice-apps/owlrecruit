/**
 * KanbanColumn Component
 * 
 * Displays a column in the Kanban board with header and applications.
 * Shows the status title with count and all applications for that status.
 * Supports drag-and-drop functionality with drop zones.
 */
'use client';

import { useDroppable } from '@dnd-kit/core';
import ApplicationCard from './ApplicationCard';
import type { Application } from "../page";

interface KanbanColumnProps {
  title: string;
  status: string;
  applications: Application[];
  onApplicationClick?: (application: Application) => void;
  isEditMode?: boolean;
  isDraggingEnabled?: boolean;
}

export default function KanbanColumn({ 
  title, 
  status, 
  applications, 
  onApplicationClick,
  isEditMode = false,
  isDraggingEnabled = false
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  const dropZoneStyle = isOver 
    ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-600' 
    : 'bg-background';

  return (
    <div className="flex flex-col">
      {/* Column Header */}
      <div className={`p-4 bg-muted rounded-t-lg border-b ${isEditMode ? 'border-blue-200 dark:border-blue-800' : ''}`}>
        <h3 className="font-semibold text-center">
          {title} ({applications.length})
        </h3>
        {isEditMode && (
          <p className="text-xs text-center text-muted-foreground mt-1">
            Drop here to move
          </p>
        )}
      </div>
      
      {/* Column Content - Drop Zone */}
      <div 
        ref={setNodeRef}
        className={`flex-1 p-4 border-l border-r border-b rounded-b-lg min-h-96 transition-colors ${dropZoneStyle} ${
          isEditMode ? 'border-dashed border-2' : ''
        }`}
      >
        <div className="space-y-3">
          {applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onClick={onApplicationClick}
              isDraggable={isDraggingEnabled}
            />
          ))}
          
          {applications.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {isEditMode ? 'Drop applications here' : 'No applications'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
