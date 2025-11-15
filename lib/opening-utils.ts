/**
 * Utility functions for parsing and formatting opening descriptions
 * with embedded deadline information
 */

export interface ParsedOpening {
  description: string;
  deadline: string | null;
}

/**
 * Parses a description string that contains a deadline marker
 * Format: "Deadline: YYYY-MM-DD\n\n[actual description]"
 */
export function parseOpeningDescription(description: string | null | undefined): ParsedOpening {
  if (!description) {
    return { description: '', deadline: null };
  }

  // Look for the deadline marker at the start of the description
  const deadlinePattern = /^Deadline:\s*(\d{4}-\d{2}-\d{2})\s*\n\n/;
  const match = description.match(deadlinePattern);

  if (match) {
    // Extract deadline and remaining description
    const deadline = match[1];
    const actualDescription = description.replace(deadlinePattern, '').trim();
    return { description: actualDescription, deadline };
  }

  // No deadline found, return description as-is
  return { description: description.trim(), deadline: null };
}

/**
 * Formats a description with a deadline for storage
 * Format: "Deadline: YYYY-MM-DD\n\n[description]"
 */
export function formatOpeningDescription(description: string, deadline: string): string {
  if (!deadline) {
    return description;
  }
  
  return `Deadline: ${deadline}\n\n${description}`;
}

/**
 * Formats a deadline date for display
 * Uses a consistent format to avoid hydration mismatches
 */
export function formatDeadlineForDisplay(deadline: string | null): string {
  if (!deadline) return 'No deadline';
  
  try {
    const date = new Date(deadline);
    
    // Use consistent formatting that works on both server and client
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${month} ${day}, ${year}`;
  } catch {
    return deadline;
  }
}

