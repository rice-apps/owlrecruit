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
import { StatusBadge } from "@/components/status-badge";
import { Search, Filter, Eye, EyeOff } from "lucide-react";
import type { ApplicationStatus } from "@/types/app";

interface Applicant {
  id: string;
  name: string;
  email: string;
  netId: string;
  year: string;
  major: string;
  status: ApplicationStatus;
  applicationId: string;
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

  const filteredApplicants = React.useMemo(() => {
    if (!searchQuery.trim()) return applicants;
    const query = searchQuery.toLowerCase();
    return applicants.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query) ||
        a.netId.toLowerCase().includes(query) ||
        a.year.toLowerCase().includes(query) ||
        a.major.toLowerCase().includes(query),
    );
  }, [applicants, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search and filters bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Applicants table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <div className="w-5 h-5 border border-gray-200 rounded-md flex items-center justify-center bg-white cursor-pointer" />
              </TableHead>
              <TableHead className="text-gray-400 font-normal">Applicant Name</TableHead>
              <TableHead className="text-gray-400 font-normal">NetID</TableHead>
              <TableHead className="text-gray-400 font-normal">Year</TableHead>
              <TableHead className="text-gray-400 font-normal">Major</TableHead>
              <TableHead className="text-gray-400 font-normal">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplicants.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  {searchQuery
                    ? "No applicants match your search."
                    : "No applicants yet."}
                </TableCell>
              </TableRow>
            ) : (
              filteredApplicants.map((applicant) => (
                <TableRow key={applicant.id} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
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
                  <TableCell className="text-gray-400">
                    {applicant.year}
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {applicant.major}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={applicant.status} />
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
