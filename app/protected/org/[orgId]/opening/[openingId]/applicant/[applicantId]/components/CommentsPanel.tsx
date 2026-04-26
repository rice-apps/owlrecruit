"use client";

import { useState, useEffect, useCallback } from "react";
import { notifications } from "@mantine/notifications";
import { logger } from "@/lib/logger";
import {
  Avatar,
  Box,
  Collapse,
  Group,
  Loader,
  Stack,
  Text,
  Textarea,
  ActionIcon,
} from "@mantine/core";
import { formatRelativeTime } from "@/lib/utils";
import { ArrowUp, ChevronDown } from "@untitled-ui/icons-react";

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
  const [isOpen, setIsOpen] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/org/${orgId}/applications/${applicantId}/reviews`,
      );
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
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
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, applicantId, fetchComments]);

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
        notifications.show({ color: "green", message: "Comment posted!" });
        fetchComments();
      }
    } catch (error) {
      logger.error("Error posting comment:", error);
      notifications.show({ color: "red", message: "Error posting comment." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="md" p="md">
      {/* Comment input */}
      <Box style={{ position: "relative" }}>
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.currentTarget.value)}
          placeholder="Add comment..."
          autosize
          minRows={1}
          maxRows={4}
          radius="xl"
          styles={{ input: { paddingRight: 40 } }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handlePostComment();
            }
          }}
        />
        <ActionIcon
          variant="subtle"
          size="sm"
          disabled={loading || !newComment.trim()}
          onClick={handlePostComment}
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
          }}
          aria-label="Post comment"
        >
          {loading ? <Loader size={14} /> : <ArrowUp width={16} height={16} />}
        </ActionIcon>
      </Box>

      {/* Comments accordion */}
      <Box>
        <Group
          justify="space-between"
          align="center"
          mb="xs"
          style={{ cursor: "pointer" }}
          onClick={() => setIsOpen((v) => !v)}
        >
          <Text fw={600} size="lg">
            Comments
          </Text>
          <ChevronDown
            width={18}
            height={18}
            style={{
              color: "var(--mantine-color-gray-5)",
              transform: isOpen ? "rotate(180deg)" : "none",
              transition: "transform 150ms",
            }}
          />
        </Group>

        <Collapse expanded={isOpen}>
          <Stack gap="sm" pt="xs">
            {comments.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="md">
                No comments yet.
              </Text>
            ) : (
              comments.map((comment, i) => (
                <Box
                  key={comment.id || i}
                  p="md"
                  style={{
                    background: "white",
                    border: "1px solid var(--mantine-color-gray-2)",
                    borderRadius: "var(--mantine-radius-md)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  <Group gap="sm" align="flex-start" mb="xs">
                    <Avatar
                      size={32}
                      color="initials"
                      name={comment.userName || ""}
                      radius="xl"
                    />
                    <Box>
                      <Text size="sm" fw={600}>
                        {comment.userName || "Unknown User"}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {formatRelativeTime(comment.createdAt)}
                      </Text>
                    </Box>
                  </Group>
                  <Text size="sm" pl={44}>
                    {comment.content}
                  </Text>
                </Box>
              ))
            )}
          </Stack>
        </Collapse>
      </Box>
    </Stack>
  );
}
