/**
 * Opening Overview Page (Flattened URL)
 *
 * Displays opening details with tabs for Overview, Applicants, Questions, and Upload.
 */

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ActionIcon, Box, Card, Group, Stack, Text } from "@mantine/core";
import Link from "next/link";
import { Pencil01 } from "@untitled-ui/icons-react";
import { OpeningStatusButton } from "@/components/opening-status-button";
import { OpeningStatusBadge } from "@/components/StatusBadge";
import { OpeningTabs } from "./components/OpeningTabs";
import { ApplicantsList } from "./components/ApplicantsList";
import { OverviewTab } from "./components/OverviewTab";
import { UploadTab } from "./components/UploadTab";
import { QuestionsTab } from "./components/QuestionsTab";
import type { ApplicationStatus } from "@/types/app";
import { logger } from "@/lib/logger";
import { Breadcrumb } from "@/components/Breadcrumb";

interface OpeningOverviewPageProps {
  params: Promise<{ openingId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

interface OpeningData {
  title: string;
  description: string | null;
  status: "open" | "closed" | "draft" | string;
  application_link: string | null;
  closes_at: string | null;
  org_id: string;
  orgs: Array<{ name: string }> | { name: string };
}

interface ApplicationRow {
  id: string;
  status: string;
  applicant_id: string;
  created_at: string | null;
  user_id: string | null;
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
  const { openingId } = await params;
  const { tab = "overview" } = await searchParams;
  const supabase = await createClient();

  const { data: openingData } = (await supabase
    .from("openings")
    .select(
      "title, description, status, application_link, closes_at, org_id, orgs(name)",
    )
    .eq("id", openingId)
    .single()) as { data: OpeningData | null; error: unknown };

  if (!openingData) {
    throw new Error("Opening not found");
  }

  const orgId = openingData.org_id;
  const orgName =
    (Array.isArray(openingData.orgs)
      ? openingData.orgs[0]?.name
      : openingData.orgs?.name) || "Organization";

  // Determine current user's role for tab visibility
  const { data: authData } = await supabase.auth.getClaims();
  let isAdmin = false;
  let isMember = false;
  if (authData?.claims) {
    const { data: membership } = await supabase
      .from("org_members")
      .select("role")
      .eq("user_id", authData.claims.sub)
      .eq("org_id", orgId)
      .maybeSingle();
    if (membership) {
      isMember = true;
      isAdmin = membership.role === "admin";
    }
  }

  const { data: applications, error: appError } = (await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      applicant_id,
      user_id,
      user:user_id (
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
    logger.error({ err: appError }, "error fetching applications");
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
            openingStatus={openingData?.status ?? null}
            applicationLink={openingData?.application_link ?? null}
          />
        );
      case "applicants":
        return <ApplicantsList applicants={applicants} />;
      case "questions":
        return (
          <QuestionsTab
            openingId={openingId}
            orgId={orgId}
            applicationLink={openingData?.application_link ?? null}
          />
        );
      case "upload":
        return <UploadTab orgId={orgId} />;
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
    <Stack gap="lg" style={{ flex: 1, width: "100%" }}>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          {
            label: orgName || "Organization",
            href: `/protected/org/${orgId}`,
          },
          { label: openingData?.title || "Opening" },
        ]}
      />

      {/* Header card */}
      <Card radius="lg" shadow="sm" withBorder={false} p="xl">
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Group gap="sm" align="center">
              <Text fw={700} size="xl">
                {openingData?.title || "Untitled Opening"}
              </Text>
              <OpeningStatusBadge status={openingData?.status || "draft"} />
            </Group>
            {openingData?.description && (
              <Text c="dimmed">{openingData.description}</Text>
            )}
          </Stack>
          <Group gap="xs">
            <OpeningStatusButton
              orgId={orgId}
              openingId={openingId}
              status={
                (openingData?.status as "open" | "closed" | "draft") || "draft"
              }
            />
            <Link href={`/protected/opening/${openingId}/edit`}>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                aria-label="Edit opening"
              >
                <Pencil01 width={16} height={16} />
              </ActionIcon>
            </Link>
          </Group>
        </Group>
      </Card>

      {/* Tabs and content */}
      <Card
        radius="lg"
        shadow="sm"
        withBorder={false}
        p={0}
        style={{ flex: 1 }}
      >
        <Box px="xl" pt="xl" pb="sm">
          <Suspense fallback={<Box h={32} />}>
            <OpeningTabs
              useNativeForm={!openingData?.application_link}
              isAdmin={isAdmin}
              isMember={isMember}
            />
          </Suspense>
        </Box>
        <Box px="xl">{renderTabContent()}</Box>
      </Card>
    </Stack>
  );
}
