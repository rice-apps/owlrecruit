"use client";

import { useState, useEffect, useCallback } from "react";
import { X, MessageSquare, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommentsPanel } from "./CommentsPanel";
import { SkillsScoringPanel } from "./SkillsScoringPanel";

interface CommentsSidebarProps {
  applicantId: string;
  openingId: string;
  orgId: string;
}

export function CommentsSidebar({
  applicantId,
  openingId,
  orgId,
}: CommentsSidebarProps) {
  const [activeTab, setActiveTab] = useState<"comments" | "skills">("comments");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch(`/api/org/${orgId}/my-role`);
        if (res.ok) {
          const data = await res.json();
          if (data.role === "admin") {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error("Error checking role:", error);
      }
    };
    if (orgId) {
      checkRole();
    }
  }, [orgId]);

  const handleToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToastMessage(message);
      setToastType(type);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    },
    [],
  );

  return (
    <div className="w-[350px] border-l h-full flex flex-col bg-background relative">
      <div className="flex items-center justify-end p-2 gap-2 border-b">
        <div className="flex bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("skills")}
            className={cn(
              "p-2 rounded-md transition-all hover:text-cyan-600",
              activeTab === "skills"
                ? "bg-white shadow text-cyan-600"
                : "text-muted-foreground",
            )}
            title="Skills & Rubric"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={cn(
              "p-2 rounded-md transition-all hover:text-cyan-600",
              activeTab === "comments"
                ? "bg-white shadow text-cyan-600"
                : "text-muted-foreground",
            )}
            title="Comments"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "comments" ? (
          <CommentsPanel
            orgId={orgId}
            applicantId={applicantId}
            onToast={handleToast}
          />
        ) : (
          <SkillsScoringPanel
            orgId={orgId}
            openingId={openingId}
            applicantId={applicantId}
            isAdmin={isAdmin}
            onToast={handleToast}
          />
        )}
      </div>

      {showToast && (
        <div
          className={cn(
            "absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md shadow-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2 z-50 text-white",
            toastType === "success" ? "bg-neutral-900" : "bg-red-600",
          )}
        >
          <span>{toastMessage}</span>
          <button
            onClick={() => setShowToast(false)}
            className="ml-2 hover:opacity-80"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
