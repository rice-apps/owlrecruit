/**
 * KanbanBoard Component
 * 
 * Client component wrapper for the Kanban board that handles interactions.
 * This allows the main page to remain a server component while having interactive elements.
 */
'use client';

import { KanbanColumn } from './index';
import type { Application } from "../admin/[id]/page";


interface KanbanBoardProps {
  applications: Application[];
}

export default function KanbanBoard({ applications }: KanbanBoardProps) {
  const columns = [
    { id: "applied", title: "Applied", status: "applied" },
    { id: "interviewing", title: "Interviewing", status: "interviewing" },
    { id: "offer", title: "Offer", status: "offer" },
    { id: "rejected", title: "Rejected", status: "rejected" },
  ];

  const getApplicationsByStatus = (status: string): Application[] => {
    return applications.filter(app => app.status === status);
  };

  const handleApplicationClick = (application: Application) => {
    console.log('Application clicked:', application);
    // TODO: Handle application click (e.g., open modal, navigate to detail page)
  };

  return (
    <div className="grid grid-cols-4 gap-6">
      {columns.map((column) => (
        <KanbanColumn
          key={column.id}
          title={column.title}
          status={column.status}
          applications={getApplicationsByStatus(column.status)}
          onApplicationClick={handleApplicationClick}
        />
      ))}
    </div>
  );
}
