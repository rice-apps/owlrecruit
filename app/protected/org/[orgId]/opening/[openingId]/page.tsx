/**
 * Opening Overview Page
 *
 * Displays opening details with tabs for Overview, Applicants, Questions, and Upload.
 */

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Box, Group, Stack, Text } from "@mantine/core";
import { ArrowLeft } from "@untitled-ui/icons-react";
import { EditOpeningDialog } from "@/components/edit-opening-dialog";
import { OpeningStatusButton } from "@/components/opening-status-button";
import { OpeningTabs } from "./components/OpeningTabs";
import { ApplicantsList } from "./components/ApplicantsList";
import { OverviewTab } from "./components/OverviewTab";
import { UploadTab } from "./components/UploadTab";
import { QuestionsTab } from "./components/QuestionsTab";
import type { ApplicationStatus } from "@/types/app";
import { logger } from "@/lib/logger";

interface OpeningOverviewPageProps {
  params: Promise<{ orgId: string; openingId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

interface ApplicationRow {
  id: string;
  status: string;
  applicant_id: string;
  created_at: string | null;
  users_id: string | null;
  user: {
    id: string;
    name: string;
    net_id: string;
    email: string;
  } | null;
  applicant: {
    id: string;
    net_id: string;
    name: string;
  } | null;
}

export default async function OpeningOverviewPage({
  params,
  searchParams,
}: OpeningOverviewPageProps) {
  const { orgId, openingId } = await params;
  const { tab = "overview" } = await searchParams;
  const supabase = await createClient();

  const { data: orgData } = await supabase
    .from("orgs")
    .select("name")
    .eq("id", orgId)
    .single();

  const { data: openingData } = await supabase
    .from("openings")
    .select("title, description, status, application_link, closes_at")
    .eq("id", openingId)
    .single();

  const { data: applications, error: appError } = (await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      applicant_id,
      users_id,
      user:users_id (
        id,
        name,
        net_id,
        email
      ),
      applicant:applicant_id (
        id,
        net_id,
        name
      )
    `,
    )
    .eq("opening_id", openingId)) as {
    data: ApplicationRow[] | null;
    error: unknown;
  };

  if (appError) {
    logger.error("Error fetching applications:", appError);
  }

  const applicants = (applications || [])
    .map((app) => {
      const userData = app.user || app.applicant;
      if (!userData) return null;

      return {
        id: app.applicant_id,
        name: userData.name || "Unknown",
        email: app.user?.email || `${userData.net_id}@rice.edu`,
        netId: userData.net_id || "",
        status: (app.status || "No Status") as ApplicationStatus,
        applicationId: app.id,
        createdAt: app.created_at,
      };
    })
    .filter((app): app is NonNullable<typeof app> => app !== null);

  const renderTabContent = () => {
    switch (tab) {
      case "overview":
        return (
          <OverviewTab
            applicants={applicants}
            orgId={orgId}
            openingId={openingId}
          />
        );
      case "applicants":
        return (
          <ApplicantsList
            applicants={applicants}
            orgId={orgId}
            openingId={openingId}
          />
        );
      case "questions":
        return (
          <QuestionsTab
            openingId={openingId}
            orgId={orgId}
            applicationLink={openingData?.application_link ?? null}
          />
        );
      case "upload":
        return <UploadTab />;
      default:
        return (
          <OverviewTab
            applicants={applicants}
            orgId={orgId}
            openingId={openingId}
            openingStatus={openingData?.status ?? null}
            applicationLink={openingData?.application_link ?? null}
          />
        );
    }
  };

  return (
    <Stack gap="lg" style={{ flex: 1, width: "100%", maxWidth: 1024 }}>
      {/* Back link */}
      <Link
        href={`/protected/org/${orgId}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: 14,
          color: "var(--mantine-color-gray-6)",
          textDecoration: "none",
        }}
      >
        <ArrowLeft width={16} height={16} />
        Back to Openings
      </Link>

      {/* Header */}
      <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
        <Box>
          <Text size="sm" c="dimmed" mb={4}>
            {orgData?.name}
          </Text>
          <Group gap="sm" align="center">
            <Text size="xl" fw={700}>
              {openingData?.title || "Untitled Opening"}
            </Text>
            <EditOpeningDialog
              orgId={orgId}
              openingId={openingId}
              initialData={{
                title: openingData?.title || "",
                description: openingData?.description || undefined,
                application_link: openingData?.application_link || undefined,
                closes_at: openingData?.closes_at || undefined,
                status: openingData?.status || "draft",
              }}
            />
          </Group>
          {openingData?.description && (
            <Text c="dimmed" mt="xs" style={{ maxWidth: 512 }}>
              {openingData.description}
            </Text>
          )}
        </Box>
        <OpeningStatusButton
          orgId={orgId}
          openingId={openingId}
          status={openingData?.status || "draft"}
        />
      </Group>

      {/* Tabs */}
      <Suspense fallback={<Box h={48} />}>
        <OpeningTabs useNativeForm={!openingData?.application_link} />
      </Suspense>

      {/* Tab content */}
      <Box style={{ flex: 1 }}>{renderTabContent()}</Box>
    </Stack>
  );
}
