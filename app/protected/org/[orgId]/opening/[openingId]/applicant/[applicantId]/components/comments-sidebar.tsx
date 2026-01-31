"use client";

import { formatRelativeTime } from "@/lib/date-utils";

import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, X, MessageSquare, Search, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommentsSidebarProps {
  applicantId: string;
  openingId: string;
  orgId: string;
}

interface Rubric {
  name: string;
  max_val: number;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userName?: string;
}

export function CommentsSidebar({
  applicantId,
  openingId,
  orgId,
}: CommentsSidebarProps) {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loadingRubrics, setLoadingRubrics] = useState(true);
  const [activeTab, setActiveTab] = useState<"comments" | "skills">("comments");

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const [scores, setScores] = useState<Record<string, number>>({});
  const [savingScore, setSavingScore] = useState(false);
  const [savedTotalScore, setSavedTotalScore] = useState<number | null>(null);

  useEffect(() => {
    const fetchRubrics = async () => {
      setLoadingRubrics(true);
      try {
        const res = await fetch(`/api/org/${orgId}/openings`);
        if (res.ok) {
          const openings = await res.json();
          const currentOpening = openings.find(
            (o: { id: string }) => o.id === openingId,
          );
          if (currentOpening?.rubrics) {
            setRubrics(currentOpening.rubrics);
          }
        }
      } catch (error) {
        console.error("Error fetching rubrics:", error);
      } finally {
        setLoadingRubrics(false);
      }
    };

    fetchRubrics();
  }, [openingId]);

  useEffect(() => {
    if (activeTab === "comments" && isCommentsOpen) {
      fetchComments();
    }
  }, [isCommentsOpen, activeTab, applicantId]);

  useEffect(() => {
    fetchComments();
  }, [applicantId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(
        `/api/org/${orgId}/applications/${applicantId}/reviews`,
      );
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
        if (data.myScore !== null && data.myScore !== undefined) {
          setSavedTotalScore(data.myScore);
        }
      } else {
        console.warn("Failed to fetch comments, API might be missing");
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

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
        setToastMessage("Comment successfully posted!");
        setToastType("success");
        setShowToast(true);
        fetchComments();
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      setToastMessage("Error posting comment.");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const updateScore = (skill: string, value: string, maxVal: number) => {
    const num = parseFloat(value);
    const newScores = { ...scores };

    if (!isNaN(num) && num >= 0 && num <= maxVal) {
      newScores[skill] = num;
    } else if (value === "") {
      delete newScores[skill];
    }

    setScores(newScores);
  };

  const handleSaveScore = async () => {
    setSavingScore(true);
    const values = Object.values(scores);
    const total = values.reduce((a, b) => a + b, 0);

    try {
      const res = await fetch(
        `/api/org/${orgId}/applications/${applicantId}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: total }),
        },
      );

      if (!res.ok) {
        console.warn("Failed to save score");
        setToastMessage("Failed to save score");
        setToastType("error");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        setToastMessage("Score successfully saved!");
        setToastType("success");
        setShowToast(true);
        setSavedTotalScore(total);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (e) {
      console.error("Error saving score", e);
      setToastMessage("Error saving score");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setSavingScore(false);
    }
  };

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxTotalScore = rubrics.reduce((a, b) => a + b.max_val, 0);

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
          <div className="p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="relative w-full">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-full text-sm bg-white border border-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-600/50"
                  placeholder="Add comment..."
                  onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
                />
                <button
                  onClick={handlePostComment}
                  disabled={loading || !newComment.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-cyan-600 disabled:opacity-30 transition-colors"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
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
              onValueChange={(val) => setIsCommentsOpen(val === "item-1")}
              defaultValue="item-1"
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
                            {/* Avatar Placeholder */}
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                              {/* TODO: Real avatar */}
                              <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  comment.userName || "User",
                                )}&background=random`}
                                alt={comment.userName}
                                className="w-full h-full object-cover"
                              />
                            </div>
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
        ) : (
          <div className="p-4">
            <div className="border rounded-xl p-6 shadow-sm bg-card">
              <div className="flex justify-between items-center mb-6">
                <span className="text-muted-foreground font-medium">
                  Skills
                </span>
                <span className="text-muted-foreground font-medium">
                  Your Score
                </span>
              </div>

              <div className="flex flex-col gap-6">
                {loadingRubrics ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : rubrics.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No rubrics defined for this opening.
                  </p>
                ) : (
                  rubrics.map((rubric) => (
                    <div
                      key={rubric.name}
                      className="flex items-center justify-between"
                    >
                      <span className="font-semibold text-sm">
                        {rubric.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max={rubric.max_val}
                          className="w-16 h-9 border rounded-[10px] text-center text-sm focus:outline-none focus:ring-1 focus:ring-cyan-600 bg-white"
                          value={scores[rubric.name] ?? ""}
                          onChange={(e) =>
                            updateScore(
                              rubric.name,
                              e.target.value,
                              rubric.max_val,
                            )
                          }
                        />
                        <span className="text-muted-foreground text-sm font-medium w-8 text-right">
                          / {rubric.max_val}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-8 pt-4 border-t">
                {savedTotalScore !== null && (
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border">
                    <p className="text-sm text-foreground font-medium">
                      Last Saved Score: {savedTotalScore} / {maxTotalScore}
                    </p>
                  </div>
                )}
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-sm">Total Score:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {totalScore}
                    </span>
                    <span className="text-muted-foreground text-sm font-medium">
                      {" "}
                      / {maxTotalScore}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleSaveScore}
                  disabled={savingScore}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {savingScore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Submit Score"
                  )}
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button className="text-cyan-600 text-sm hover:underline">
                Rubric Details
              </button>
            </div>
          </div>
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
