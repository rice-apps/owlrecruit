"use client";

import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ResumePreviewProps {
  resumeUrl: string | null;
  applicantName?: string;
}

export function ResumePreview({
  resumeUrl,
  applicantName,
}: ResumePreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [error, setError] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container width to scale PDF
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          // Use contentBoxSize for more precise measurement
          // contentBoxSize is an array in newer browsers
          const contentBoxSize = Array.isArray(entry.contentBoxSize)
            ? entry.contentBoxSize[0]
            : entry.contentBoxSize;
          setContainerWidth(contentBoxSize.inlineSize);
        } else {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setError(false);
  }

  function onDocumentLoadError() {
    setError(true);
  }

  if (!resumeUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 bg-muted rounded-md">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No resume available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <FileText className="h-5 w-5" />
          Resume {applicantName && `- ${applicantName}`}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        </div>
      </div>

      <div
        ref={containerRef}
        className="border rounded-md bg-white min-h-[600px] flex justify-center p-4 overflow-auto max-h-[800px] shadow-sm"
      >
        {error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <p className="text-red-500 font-medium">
              Unable to display PDF inline.
            </p>
            <p className="text-sm text-muted-foreground max-w-xs">
              This may be due to browser security settings or the file type.
            </p>
            <Button asChild variant="outline">
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </a>
            </Button>
          </div>
        ) : (
          <Document
            file={resumeUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-96 w-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
            className="max-w-full"
          >
            {numPages &&
              Array.from(new Array(numPages), (el, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="mb-4 shadow-md"
                  width={containerWidth ? containerWidth - 48 : undefined} // Subtract padding (24px * 2)
                />
              ))}
          </Document>
        )}
      </div>
    </div>
  );
}
