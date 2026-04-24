"use client";

import { useState, useEffect } from "react";
import { MessageChatCircle, SearchMd } from "@untitled-ui/icons-react";
import { logger } from "@/lib/logger";
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
        logger.error("Error checking role:", error);
      }
    };
    if (orgId) {
      checkRole();
    }
  }, [orgId]);

  return (
    <div className="w-[350px] border-l h-full flex flex-col bg-background relative">
      <div className="flex items-center justify-end p-2 gap-2 border-b">
        <div className="flex bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("skills")}
            className={cn(
              "p-2 rounded-md transition-all hover:text-owl-purple",
              activeTab === "skills"
                ? "bg-white shadow text-owl-purple"
                : "text-muted-foreground",
            )}
            title="Skills & Rubric"
          >
            <SearchMd className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={cn(
              "p-2 rounded-md transition-all hover:text-owl-purple",
              activeTab === "comments"
                ? "bg-white shadow text-owl-purple"
                : "text-muted-foreground",
            )}
            title="Comments"
          >
            <MessageChatCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "comments" ? (
          <CommentsPanel orgId={orgId} applicantId={applicantId} />
        ) : (
          <SkillsScoringPanel
            orgId={orgId}
            openingId={openingId}
            applicantId={applicantId}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </div>
  );
}
