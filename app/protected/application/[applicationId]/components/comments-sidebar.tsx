"use client";

import { useState, useEffect } from "react";
import { MessageChatCircle, SearchMd } from "@untitled-ui/icons-react";
import { Box, Group, ActionIcon } from "@mantine/core";
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
  const [activeTab, setActiveTab] = useState<"comments" | "skills">("skills");
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
      } catch {
        // role defaults to non-admin
      }
    };
    if (orgId) {
      checkRole();
    }
  }, [orgId]);

  return (
    <Box
      style={{
        width: 350,
        border: "1px solid var(--mantine-color-gray-2)",
        borderRadius: "var(--mantine-radius-lg)",
        height: "fit-content",
        display: "flex",
        flexDirection: "column",
        background: "white",
        overflow: "hidden",
      }}
    >
      {/* Tab toggle */}
      <Group
        justify="flex-end"
        p="xs"
        gap="xs"
        style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}
      >
        <Box
          p={4}
          style={{
            display: "flex",
            gap: 4,
            background: "var(--mantine-color-gray-1)",
            borderRadius: "var(--mantine-radius-md)",
          }}
        >
          <ActionIcon
            variant={activeTab === "skills" ? "white" : "transparent"}
            size="sm"
            color={activeTab === "skills" ? "owlTeal" : "gray"}
            onClick={() => setActiveTab("skills")}
            title="Skills & Rubric"
          >
            <SearchMd width={18} height={18} />
          </ActionIcon>
          <ActionIcon
            variant={activeTab === "comments" ? "white" : "transparent"}
            size="sm"
            color={activeTab === "comments" ? "owlTeal" : "gray"}
            onClick={() => setActiveTab("comments")}
            title="Comments"
          >
            <MessageChatCircle width={18} height={18} />
          </ActionIcon>
        </Box>
      </Group>

      <Box style={{ flex: 1, overflowY: "auto" }}>
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
      </Box>
    </Box>
  );
}
