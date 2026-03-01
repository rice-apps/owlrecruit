"use client";

import * as React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import {
  SearchMd,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
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
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
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

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.email.toLowerCase().includes(query) ||
          a.netId.toLowerCase().includes(query),
      );
    }

    // Sort
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
      <ArrowUp className="inline h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="inline h-3 w-3 ml-1" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and filters bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <SearchMd className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search applicant by name, netid, year, major..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAnonymousView(!anonymousView)}
          className="gap-2"
        >
          {anonymousView ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          Anonymous View
        </Button>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ALL_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Applicants table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <div className="w-5 h-5 border border-gray-200 rounded-md flex items-center justify-center bg-white cursor-pointer" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:text-gray-900"
                onClick={() => handleSort("name")}
              >
                Applicant Name
                <SortIcon field="name" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:text-gray-900"
                onClick={() => handleSort("email")}
              >
                NetID
                <SortIcon field="email" />
              </TableHead>
              <TableHead className="text-gray-400 font-normal">Year</TableHead>
              <TableHead className="text-gray-400 font-normal">Major</TableHead>
              <TableHead
                className="cursor-pointer select-none hover:text-gray-900"
                onClick={() => handleSort("status")}
              >
                Status
                <SortIcon field="status" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:text-gray-900"
                onClick={() => handleSort("date")}
              >
                Applied
                <SortIcon field="date" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplicants.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-gray-500"
                >
                  {searchQuery || statusFilter !== "all"
                    ? "No applicants match your filters."
                    : "No applicants yet."}
                </TableCell>
              </TableRow>
            ) : (
              filteredApplicants.map((applicant) => (
                <TableRow
                  key={applicant.id}
                  className="hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <TableCell>
                    <div className="w-5 h-5 border border-gray-200 rounded-md flex items-center justify-center bg-white cursor-pointer" />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/protected/org/${orgId}/opening/${openingId}/applicant/${applicant.applicationId}`}
                      className="font-bold text-gray-900 hover:text-cyan-600"
                    >
                      {anonymousView
                        ? `Applicant ${applicant.id.slice(0, 8)}`
                        : applicant.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {anonymousView ? "***" : applicant.netId}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={applicant.status} />
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {applicant.createdAt
                      ? new Date(applicant.createdAt).toLocaleDateString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer with count */}
      <div className="text-sm text-gray-500">
        Showing {filteredApplicants.length} of {applicants.length} applicants
      </div>
    </div>
  );
}
