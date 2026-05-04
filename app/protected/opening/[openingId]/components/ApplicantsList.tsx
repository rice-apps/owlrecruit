"use client";

import * as React from "react";
import Link from "next/link";
import {
  Button,
  Checkbox,
  Group,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { FilterLines, SearchMd } from "@untitled-ui/icons-react";
import type { ApplicationStatus } from "@/types/app";
import { APPLICATION_STATUS_LIST } from "@/lib/status";

interface Applicant {
  id: string;
  name: string;
  email: string;
  netId: string;
  status: ApplicationStatus;
  applicationId: string;
  createdAt: string | null;
}

interface ApplicantsListProps {
  applicants: Applicant[];
  orgId: string;
}

export function ApplicantsList({ applicants, orgId }: ApplicantsListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [anonymousView, setAnonymousView] = React.useState(false);
  const [statuses, setStatuses] = React.useState<
    Record<string, ApplicationStatus>
  >(() =>
    Object.fromEntries(applicants.map((a) => [a.applicationId, a.status])),
  );
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const handleStatusChange = async (
    applicationId: string,
    newStatus: string | null,
  ) => {
    if (!newStatus) return;
    setUpdatingId(applicationId);
    try {
      const res = await fetch(
        `/api/org/${orgId}/applications/${applicationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      if (res.ok) {
        setStatuses((prev) => ({
          ...prev,
          [applicationId]: newStatus as ApplicationStatus,
        }));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredApplicants = React.useMemo(() => {
    if (!searchQuery.trim()) return applicants;
    const query = searchQuery.toLowerCase();
    return applicants.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query) ||
        a.netId.toLowerCase().includes(query),
    );
  }, [applicants, searchQuery]);

  return (
    <Stack gap="md">
      {/* Toolbar */}
      <Group gap="sm" wrap="nowrap" align="center">
        <TextInput
          placeholder="Search applicants by name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          leftSection={<SearchMd width={16} height={16} />}
          radius="xl"
          style={{ flex: 1 }}
        />
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" c="dimmed" style={{ whiteSpace: "nowrap" }}>
            Anonymous view
          </Text>
          <Switch
            checked={anonymousView}
            onChange={(e) => setAnonymousView(e.currentTarget.checked)}
            size="sm"
          />
        </Group>
        <Group gap={4} wrap="nowrap" style={{ cursor: "pointer" }}>
          <Text size="sm" c="dimmed" style={{ whiteSpace: "nowrap" }}>
            Filter
          </Text>
          <FilterLines width={16} height={16} />
        </Group>
        {/* FIXME: no-op button — no onClick handler; red text indicates unimplemented functionality */}
        <Button
          color="dark"
          radius="xl"
          size="sm"
          styles={{ label: { color: "red" } }}
        >
          Submit results
        </Button>
      </Group>

      {/* Applicants table */}
      <Table withTableBorder={false} highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={40}>
              <Checkbox size="sm" />
            </Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Status</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filteredApplicants.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Text ta="center" py="xl" c="dimmed" size="sm">
                  {searchQuery
                    ? "No applicants match your filters."
                    : "No applicants yet."}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            filteredApplicants.map((applicant) => (
              <Table.Tr key={applicant.id}>
                <Table.Td>
                  <Checkbox size="sm" />
                </Table.Td>
                <Table.Td>
                  <Link
                    href={`/protected/application/${applicant.applicationId}`}
                    style={{
                      fontWeight: 600,
                      color: "var(--mantine-color-gray-9)",
                      textDecoration: "none",
                    }}
                  >
                    {anonymousView
                      ? `Applicant ${filteredApplicants.indexOf(applicant) + 1}`
                      : applicant.name}
                  </Link>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {anonymousView ? "***" : applicant.email}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Select
                    data={APPLICATION_STATUS_LIST}
                    value={
                      statuses[applicant.applicationId] ?? applicant.status
                    }
                    onChange={(val) =>
                      handleStatusChange(applicant.applicationId, val)
                    }
                    disabled={updatingId === applicant.applicationId}
                    size="xs"
                    w={140}
                    comboboxProps={{ withinPortal: true }}
                  />
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      <Text size="sm" c="dimmed" pb="xl">
        Showing {filteredApplicants.length} of {applicants.length} applicants
      </Text>
    </Stack>
  );
}
