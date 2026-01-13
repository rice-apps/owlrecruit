/**
 * ApplicationCard Component
 *
 * Displays an individual application in a card format with applicant name and position.
 * Used within the Kanban board columns. Supports drag-and-drop functionality.
 */
"use client";

import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import type { Application } from "../page";

interface ApplicationCardProps {
  application: Application;
  onClick?: (application: Application) => void;
  isDraggable?: boolean;
  isDragging?: boolean;
}

export default function ApplicationCard({
  application,
  onClick,
  isDraggable = false,
  isDragging = false,
}: ApplicationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isCurrentlyDragging,
  } = useDraggable({
    id: application.id,
    disabled: !isDraggable,
  });

  // Format the applied date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const cardClasses = [
    "p-4 bg-card border rounded-lg shadow-sm space-y-3 transition-all hover:shadow-md",
    isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
    (isCurrentlyDragging || isDragging) && "opacity-50",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cardClasses}
      onClick={() => !isDraggable && onClick?.(application)}
      {...attributes}
      {...listeners}
    >
      {/* Drag Handle - Only show when being dragged */}
      {(isCurrentlyDragging || isDragging) && (
        <div className="flex justify-center mb-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Name and Position */}
      <div>
        <h4 className="font-medium text-sm">{application.users?.name}</h4>
        <p className="text-xs text-muted-foreground">{application.position}</p>
      </div>

      {/* Net ID and Email */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">NetID:</span>{" "}
          {application.users?.net_id}
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Email:</span> {application.users?.email}
        </p>
      </div>

      {/* Applied Date */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Applied:</span>{" "}
          {formatDate(application.created_at)}
        </p>
      </div>
    </div>
  );
}
