"use client";

import * as React from "react";
import Link from "next/link";
import {
  Button,
  Group,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { ApplicationStatusBadge } from "@/components/StatusBadge";
import {
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  SearchMd,
} from "@untitled-ui/icons-react";
import type { ApplicationStatus } from "@/types/app";

const ALL_STATUSES: ApplicationStatus[] = [
  "No Status",
  "Applied",
  "Interviewing",
  "Offer",
  "Accepted Offer",
  "Rejected",
];

type SortField = "name" | "email" | "status" | "date";
type SortDirection = "asc" | "desc";

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
  openingId: string;
}

export function ApplicantsList({
  applicants,
  orgId,
  openingId,
}: ApplicantsListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [anonymousView, setAnonymousView] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null);
  const [sortField, setSortField] = React.useState<SortField>("name");
  const [sortDirection, setSortDirection] =
    React.useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredApplicants = React.useMemo(() => {
    let result = applicants;

    if (statusFilter) {
      result = result.filter((a) => a.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.email.toLowerCase().includes(query) ||
          a.netId.toLowerCase().includes(query),
      );
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "date":
          cmp = (a.createdAt || "").localeCompare(b.createdAt || "");
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [applicants, searchQuery, statusFilter, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ArrowUp
        width={12}
        height={12}
        style={{ marginLeft: 4, display: "inline" }}
      />
    ) : (
      <ArrowDown
        width={12}
        height={12}
        style={{ marginLeft: 4, display: "inline" }}
      />
    );
  };

  const thStyle: React.CSSProperties = {
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  return (
    <Stack gap="md">
      {/* Search and filters bar */}
      <Group gap="sm" wrap="wrap">
        <TextInput
          placeholder="Search by name, netid, email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          leftSection={<SearchMd width={16} height={16} />}
          style={{ flex: 1, minWidth: 200 }}
        />
        <Button
          variant="default"
          size="sm"
          leftSection={
            anonymousView ? (
              <EyeOff width={16} height={16} />
            ) : (
              <Eye width={16} height={16} />
            )
          }
          onClick={() => setAnonymousView(!anonymousView)}
        >
          Anonymous View
        </Button>
        <Select
          placeholder="All Statuses"
          data={ALL_STATUSES.map((s) => ({ value: s, label: s }))}
          value={statusFilter}
          onChange={setStatusFilter}
          clearable
          size="sm"
          style={{ width: 180 }}
        />
      </Group>

      {/* Applicants table */}
      <Table withTableBorder withColumnBorders={false} highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={thStyle} onClick={() => handleSort("name")}>
              Applicant Name <SortIcon field="name" />
            </Table.Th>
            <Table.Th style={thStyle} onClick={() => handleSort("email")}>
              NetID <SortIcon field="email" />
            </Table.Th>
            <Table.Th style={thStyle} onClick={() => handleSort("status")}>
              Status <SortIcon field="status" />
            </Table.Th>
            <Table.Th style={thStyle} onClick={() => handleSort("date")}>
              Applied <SortIcon field="date" />
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filteredApplicants.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Text ta="center" py="xl" c="dimmed" size="sm">
                  {searchQuery || statusFilter
                    ? "No applicants match your filters."
                    : "No applicants yet."}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            filteredApplicants.map((applicant) => (
              <Table.Tr key={applicant.id}>
                <Table.Td>
                  <Link
                    href={`/protected/org/${orgId}/opening/${openingId}/applicant/${applicant.applicationId}`}
                    style={{
                      fontWeight: 600,
                      color: "var(--mantine-color-gray-9)",
                      textDecoration: "none",
                    }}
                  >
                    {anonymousView
                      ? `Applicant ${applicant.id.slice(0, 8)}`
                      : applicant.name}
                  </Link>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {anonymousView ? "***" : applicant.netId}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <ApplicationStatusBadge status={applicant.status} />
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {applicant.createdAt
                      ? new Date(applicant.createdAt).toLocaleDateString()
                      : "-"}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      <Text size="sm" c="dimmed">
        Showing {filteredApplicants.length} of {applicants.length} applicants
      </Text>
    </Stack>
  );
}
