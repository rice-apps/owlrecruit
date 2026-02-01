/**
 * Formats a date string or object into a relative time string (e.g., "2d", "5h", "Just now").
 * @param date The date to format (string or Date object)
 * @returns A concise relative time string
 */
export function formatRelativeTime(date: string | Date): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w`;
  }

  // Fallback to absolute date for older items
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
