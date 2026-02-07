/**
 * ApplicationCard Component
 *
 * Displays an application card with position, organization, status, and due date
 * Matches the design from the My Applications mockup with pink gradient header
 */
"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { Enums } from "@/types/supabase";

// Application status type from database enum
type ApplicationStatus = Enums<"status">;

interface ApplicationCardProps {
    application: {
        org_id: string;
        opening_id: string;
        status: ApplicationStatus | null;
        created_at: string | null;
        opening_title?: string;
        org_name?: string;
        closes_at?: string | null;
    };
}

/**
 * Maps application status to appropriate badge variant for visual consistency
 */
const getStatusBadgeVariant = (
    status: ApplicationStatus | null,
): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case "No Status":
        case "Applied":
            return "secondary";
        case "Interviewing":
            return "default";
        case "Offer":
        case "Accepted Offer":
            return "default";
        case "Rejected":
            return "destructive";
        default:
            return "outline";
    }
};

/**
 * Formats ISO date string to user-friendly format (e.g., "10/27/2026")
 */
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
};

/**
 * Gets the first letter of organization name for the icon
 */
const getOrgInitial = (orgName?: string) => {
    if (!orgName) return "?";
    return orgName.charAt(0).toUpperCase();
};

export default function ApplicationCard({ application }: ApplicationCardProps) {
    const router = useRouter();

    const handleClick = () => {
        // Navigate to the organization page for this application
        router.push(`/protected/org/${application.org_id}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
        }
    };

    return (
        <div
            className="w-64 bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-105"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label={`Application for ${application.opening_title} at ${application.org_name}`}
        >
            {/* Pink gradient header with organization icon */}
            <div className="h-24 bg-gradient-to-br from-pink-500 to-pink-600 relative flex items-center justify-center">
                <div className="absolute bottom-3 left-3 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-xl font-bold text-pink-600">
                        {getOrgInitial(application.org_name)}
                    </span>
                </div>
            </div>

            {/* Card content */}
            <div className="p-4 pt-2">
                {/* Position title */}
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    {application.opening_title || "Unknown Position"}
                </h3>

                {/* Organization name */}
                <p className="text-sm text-gray-600 mb-3">
                    {application.org_name || "Unknown Organization"}
                </p>

                {/* Status badge */}
                <div className="mb-2">
                    <Badge
                        variant={getStatusBadgeVariant(application.status)}
                        className="text-xs"
                    >
                        {application.status ?? "No Status"}
                    </Badge>
                </div>

                {/* Due date */}
                {application.closes_at && (
                    <p className="text-xs text-gray-500">
                        Due {formatDate(application.closes_at)}
                    </p>
                )}
            </div>
        </div>
    );
}
