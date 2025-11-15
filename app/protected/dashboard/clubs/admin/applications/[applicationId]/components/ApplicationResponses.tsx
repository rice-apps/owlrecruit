'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Application {
  id: string;
  org_id: string;
  applicant_id: string;
  position: string;
  status: string;
  form_responses: any | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Organization {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface ApplicationResponsesProps {
  application: Application;
  orgInfo: Organization;
}

export default function ApplicationResponses({ application, orgInfo }: ApplicationResponsesProps) {
  const [selectedResponse, setSelectedResponse] = useState<{question: string, answer: string} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const CHARACTER_LIMIT = 150;

  const truncateText = (text: string, limit: number) => {
    if (text.length <= limit) return { text, isTruncated: false };
    return {
      text: text.substring(0, limit) + '...',
      isTruncated: true
    };
  };

  const handleViewMore = (question: string, answer: string) => {
    setSelectedResponse({ question, answer });
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Application
        </h3>
      </div>
      
      {/* Application Status & Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Organization
          </label>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {orgInfo.name}
          </p>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Position
          </label>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {application.position}
          </p>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Status
          </label>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {application.status}
          </p>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Submitted
          </label>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {new Date(application.created_at).toLocaleDateString()}
          </p>
        </div> 
      </div>
      {/* Application Notes */}
      {application.notes && (
        <div className="space-y-4 mt-6 mb-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
            Notes
          </h4>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {application.notes}
            </p>
          </div>
        </div>
      )}
      {/* Form Responses */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
          Form Responses
        </h4>

        {application.form_responses && Object.keys(application.form_responses).length > 0 ? (
          <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className="space-y-3">
              {Object.entries(application.form_responses).map(([key, value]) => {
                const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
                const { text, isTruncated } = truncateText(displayValue, CHARACTER_LIMIT);
                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                return (
                  <div key={key} className="flex justify-between items-start gap-4 border-b border-gray-200 dark:border-gray-600 pb-2 last:border-b-0 last:pb-0">
                    <div className="flex-shrink-0 min-w-0 max-w-[40%]">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formattedKey}:
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <div className="text-sm text-gray-900 dark:text-gray-100 break-words overflow-wrap-anywhere">
                        {text}
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button
                          onClick={() => handleViewMore(formattedKey, displayValue)}
                          variant="secondary"
                          size="sm"
                        >
                          Read more
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-2xl mb-2"></div>
            <p className="text-sm">No form responses available</p>
          </div>
        )}
      </div>

      {/* Modal for Full Text */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold break-words min-w-0">
              {selectedResponse?.question}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Full response text
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 max-h-[60vh] overflow-y-auto overflow-x-hidden">
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-all min-w-0">
              {selectedResponse?.answer}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}