import type { CsvColumn } from '../types/report.types';

/**
 * Escape a value for CSV format (handle commas, quotes, newlines)
 */
function escapeValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generate CSV content from data array using column definitions
 */
export function generateCsvContent<T>(
  data: T[],
  columns: CsvColumn<T>[]
): string {
  // Header row
  const headers = columns.map((col) => escapeValue(col.header)).join(',');

  // Data rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value =
          typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
        return escapeValue(String(value ?? ''));
      })
      .join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Trigger a CSV file download in the browser
 */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format minutes to a readable duration string
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Format a number as a percentage string
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
