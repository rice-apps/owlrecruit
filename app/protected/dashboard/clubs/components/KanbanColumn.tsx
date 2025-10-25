/**
 * KanbanColumn Component
 * 
 * Displays a column in the Kanban board with header and applications.
 * Shows the status title with count and all applications for that status.
 */
'use client';

import ApplicationCard from './ApplicationCard';
import type { Application } from "../admin/[id]/page";


interface KanbanColumnProps {
  title: string;
  status: string;
  applications: Application[];
  onApplicationClick?: (application: Application) => void;
}

export default function KanbanColumn({ 
  title, 
  status, 
  applications, 
  onApplicationClick 
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col">
      {/* Column Header */}
      <div className="p-4 bg-muted rounded-t-lg border-b">
        <h3 className="font-semibold text-center">
          {title} ({applications.length})
        </h3>
      </div>
      
      {/* Column Content */}
      <div className="flex-1 p-4 bg-background border-l border-r border-b rounded-b-lg min-h-96">
        <div className="space-y-3">
          {applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onClick={onApplicationClick}
            />
          ))}
          
          {applications.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No applications
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
