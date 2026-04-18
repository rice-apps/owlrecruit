"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/date-utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loading01, ArrowUp } from "@untitled-ui/icons-react";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userName?: string;
}

interface CommentsPanelProps {
  orgId: string;
  applicantId: string;
}

export function CommentsPanel({ orgId, applicantId }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/org/${orgId}/applications/${applicantId}/reviews`,
      );
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      } else {
        logger.warn("Failed to fetch comments, API might be missing");
      }
    } catch (error) {
      logger.error("Error fetching comments:", error);
    }
  }, [orgId, applicantId]);

  useEffect(() => {
    fetchComments();
  }, [applicantId, fetchComments]);

  useEffect(() => {
    if (isCommentsOpen) {
      fetchComments();
    }
  }, [isCommentsOpen, applicantId, fetchComments]);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/org/${orgId}/applications/${applicantId}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: newComment }),
        },
      );

      if (res.ok) {
        setNewComment("");
        toast.success("Comment successfully posted!");
        fetchComments();
      }
    } catch (error) {
      logger.error("Error posting comment:", error);
      toast.error("Error posting comment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full pl-4 pr-10 py-3 rounded-full text-sm bg-white border border-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-owl-purple/50"
            placeholder="Add comment..."
            onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
          />
          <button
            onClick={handlePostComment}
            disabled={loading || !newComment.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-owl-purple disabled:opacity-30 transition-colors"
          >
            {loading ? (
              <Loading01 className="h-5 w-5 animate-spin" />
            ) : (
              <div className="bg-muted rounded-full p-1">
                <ArrowUp className="h-4 w-4" />
              </div>
            )}
          </button>
        </div>
      </div>

      <Accordion
        type="single"
        collapsible
        className="w-full"
        value={isCommentsOpen ? "item-1" : ""}
        onValueChange={(val) => setIsCommentsOpen(val === "item-1")}
      >
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="py-2 hover:no-underline font-semibold text-lg text-foreground">
            Comments
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-3 py-2">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet.
                </p>
              ) : (
                comments.map((comment, i) => (
                  <div
                    key={comment.id || i}
                    className="bg-white p-4 rounded-xl border shadow-sm"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {(comment.userName || "User")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-foreground">
                          {comment.userName || "Unknown User"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-foreground pl-11">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
