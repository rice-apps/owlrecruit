"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h2 className="text-2xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-center max-w-md">
        An unexpected error occurred. Please try again, or contact support if
        the problem persists.
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
