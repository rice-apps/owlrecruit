"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";
import { ApplicationCard } from "./components/applicationCard";
import { Application } from "./columns";

interface ApplicationsCardViewProps {
  data: Application[];
}

const ITEMS_PER_PAGE = 12;

export function ApplicationsCardView({ data }: ApplicationsCardViewProps) {
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
  const [currentPage, setCurrentPage] = React.useState(0);

  // Get unique status values for filter
  const uniqueStatuses = React.useMemo(() => {
    const statuses = new Set<string>();
    data.forEach((application) => {
      if (application.status) {
        statuses.add(application.status);
      }
    });
    return Array.from(statuses);
  }, [data]);

  // Filter applications by selected statuses
  const filteredApplications = React.useMemo(() => {
    if (selectedStatuses.length === 0) {
      return data;
    }
    return data.filter((application) =>
      selectedStatuses.includes(application.status),
    );
  }, [data, selectedStatuses]);

  const paginatedApplications = React.useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredApplications.slice(start, end);
  }, [filteredApplications, currentPage]);

  const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE);
  const canPreviousPage = currentPage > 0;
  const canNextPage = currentPage < totalPages - 1;

  React.useEffect(() => {
    setCurrentPage(0);
  }, [selectedStatuses]);

  const toggleStatus = (status: string, checked: boolean) => {
    setSelectedStatuses((prev) =>
      checked ? [...prev, status] : prev.filter((s) => s !== status),
    );
  };

  const clearFilters = () => {
    setSelectedStatuses([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <Filter className="mr-2 h-4 w-4" />
              Status
              {selectedStatuses.length > 0 && (
                <span className="ml-2 rounded-md bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {selectedStatuses.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {uniqueStatuses.map((status) => {
              const isSelected = selectedStatuses.includes(status);
              return (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={isSelected}
                  onCheckedChange={(checked) => toggleStatus(status, checked)}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              );
            })}
            {selectedStatuses.length > 0 && (
              <>
                <DropdownMenuCheckboxItem
                  checked={false}
                  onCheckedChange={clearFilters}
                  className="justify-center text-center font-medium"
                >
                  Clear filters
                </DropdownMenuCheckboxItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {paginatedApplications.length > 0 ? (
          paginatedApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))
        ) : (
          <div className="col-span-full rounded-md border bg-card p-8 text-center">
            <p className="text-muted-foreground">No applications found.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => prev - 1)}
          disabled={!canPreviousPage}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={!canNextPage}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
