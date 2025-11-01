/**
 * Parses a single CSV line, handling quoted fields that may contain commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Handle escaped quotes ("")
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Parses CSV text into an array of objects
 * @param csvText - The raw CSV text to parse
 * @returns Array of objects with keys matching the CSV headers
 * @throws Error if CSV has no header or data rows
 */
export function parseCSV(csvText: string): Record<string, string | null>[] {
  const lines = csvText.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV must contain header and at least one data row');
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const records: Record<string, string | null>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length !== headers.length) {
      continue; // Skip malformed rows
    }

    const record: Record<string, string | null> = {};
    headers.forEach((header, index) => {
      let value = values[index];

      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }

      // Handle empty strings as null
      record[header] = value === '' ? null : value;
    });

    records.push(record);
  }

  return records;
}
