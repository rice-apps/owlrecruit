    /**
 * ApplicationCard Component
 * 
 * Displays an individual application in a card format with applicant name and position.
 * Used within the Kanban board columns.
 */
'use client';

import type { Application } from "../admin/[id]/page";

interface ApplicationCardProps {
  application: Application;
  onClick?: (application: Application) => void;
}

export default function ApplicationCard({ application, onClick }: ApplicationCardProps) {
    // Format the applied date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
        });
    };
    
    return (
    <div
      key={application.id}
      className="p-4 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer space-y-3"
      onClick={() => onClick?.(application)}
    >
      {/* Name and Position */}
      <div>
        <h4 className="font-medium text-sm">{application.users?.name}</h4>
        <p className="text-xs text-muted-foreground">
          {application.position}
        </p>
      </div>

      {/* Net ID and Email */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">NetID:</span> {application.users?.net_id}
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Email:</span> {application.users?.email}
        </p>
      </div>

      {/* Applied Date */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Applied:</span> {formatDate(application.created_at)}
        </p>
      </div>

      {/* Notes if they exist */}
      {application.notes && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Notes:</span> {application.notes}
          </p>
        </div>
      )}
    </div>
  );
}