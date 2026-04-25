"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Group, Stack, Table, Text, TextInput } from "@mantine/core";
import { ApplicationStatusBadge } from "@/components/StatusBadge";
import { SearchMd } from "@untitled-ui/icons-react";
import type { ApplicationStatus } from "@/types/app";

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
  }, [applicants, searchQuery, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return (
      <span style={{ marginLeft: 4, fontSize: 10 }}>
        {sortDirection === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  const thStyle: React.CSSProperties = {
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  return (
    <Stack gap="md">
      {/* Toolbar */}
      <Group gap="sm" wrap="nowrap">
        <TextInput
          placeholder="Search applicants by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          leftSection={<SearchMd width={16} height={16} />}
          style={{ flex: 1 }}
        />
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" c="dimmed" style={{ whiteSpace: "nowrap" }}>
            Anonymous view
          </Text>
          <input
            type="checkbox"
            checked={anonymousView}
            onChange={(e) => setAnonymousView(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
        </Group>
        <Button color="dark" radius="xl" size="sm">
          Submit results
        </Button>
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
