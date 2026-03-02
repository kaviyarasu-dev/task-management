/**
 * CSV Export utilities for report data
 */

import type { ColumnDefinition } from './export.types';
import type {
  TaskMetrics,
  UserProductivity,
  TeamWorkload,
  ProjectSummary,
  VelocityReport,
} from '../reports.types';

/**
 * Escape a value for CSV format
 * Handles commas, quotes, and newlines
 */
function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format a value for CSV output
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Generic CSV exporter
 * Converts an array of objects to CSV format
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ColumnDefinition[]
): string {
  if (data.length === 0) {
    // Return headers only for empty data
    return columns.map((col) => escapeCSVValue(col.header)).join(',');
  }

  const headers = columns.map((col) => escapeCSVValue(col.header)).join(',');

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        const formattedValue = col.formatter ? col.formatter(value) : formatValue(value);
        return escapeCSVValue(formattedValue);
      })
      .join(',')
  );

  return [headers, ...rows].join('\n');
}

/**
 * Export TaskMetrics to CSV
 * Creates a summary table with categories
 */
export function exportTaskMetricsCSV(metrics: TaskMetrics): string {
  const rows: Array<{ Category: string; Name: string; Count: number; Percentage: string }> = [];

  // Summary section
  rows.push({
    Category: 'Summary',
    Name: 'Total Tasks',
    Count: metrics.totalTasks,
    Percentage: '100.0%',
  });
  rows.push({
    Category: 'Summary',
    Name: 'Completed Tasks',
    Count: metrics.completedTasks,
    Percentage:
      metrics.totalTasks > 0
        ? `${((metrics.completedTasks / metrics.totalTasks) * 100).toFixed(1)}%`
        : '0.0%',
  });
  rows.push({
    Category: 'Summary',
    Name: 'Overdue',
    Count: metrics.overdueCount,
    Percentage:
      metrics.totalTasks > 0
        ? `${((metrics.overdueCount / metrics.totalTasks) * 100).toFixed(1)}%`
        : '0.0%',
  });
  rows.push({
    Category: 'Summary',
    Name: 'Completed This Week',
    Count: metrics.completedThisWeek,
    Percentage:
      metrics.totalTasks > 0
        ? `${((metrics.completedThisWeek / metrics.totalTasks) * 100).toFixed(1)}%`
        : '0.0%',
  });
  rows.push({
    Category: 'Summary',
    Name: 'Avg Completion Time (hours)',
    Count: Math.round(metrics.averageCompletionTimeHours * 10) / 10,
    Percentage: '-',
  });

  // Status distribution
  for (const status of metrics.statusDistribution) {
    rows.push({
      Category: 'Status',
      Name: status.name,
      Count: status.count,
      Percentage:
        metrics.totalTasks > 0
          ? `${((status.count / metrics.totalTasks) * 100).toFixed(1)}%`
          : '0.0%',
    });
  }

  // Priority distribution
  for (const priority of metrics.priorityDistribution) {
    rows.push({
      Category: 'Priority',
      Name: priority.priority,
      Count: priority.count,
      Percentage:
        metrics.totalTasks > 0
          ? `${((priority.count / metrics.totalTasks) * 100).toFixed(1)}%`
          : '0.0%',
    });
  }

  const columns: ColumnDefinition[] = [
    { key: 'Category', header: 'Category' },
    { key: 'Name', header: 'Name' },
    { key: 'Count', header: 'Count' },
    { key: 'Percentage', header: 'Percentage' },
  ];

  return exportToCSV(rows, columns);
}

/**
 * Export UserProductivity data to CSV
 */
export function exportUserProductivityCSV(data: UserProductivity[]): string {
  const columns: ColumnDefinition[] = [
    { key: 'userName', header: 'User' },
    { key: 'userEmail', header: 'Email' },
    { key: 'totalTasks', header: 'Total Tasks' },
    { key: 'completedTasks', header: 'Completed' },
    { key: 'overdueTasks', header: 'Overdue' },
    {
      key: 'onTimePercentage',
      header: 'On-Time %',
      formatter: (v) => `${Number(v).toFixed(1)}%`,
    },
  ];

  return exportToCSV(data as unknown as Record<string, unknown>[], columns);
}

/**
 * Export TeamWorkload data to CSV
 */
export function exportTeamWorkloadCSV(data: TeamWorkload[]): string {
  const columns: ColumnDefinition[] = [
    { key: 'userName', header: 'Team Member' },
    { key: 'userEmail', header: 'Email' },
    { key: 'totalTasks', header: 'Total Tasks' },
    { key: 'urgent', header: 'Urgent' },
    { key: 'highPriority', header: 'High Priority' },
    { key: 'overdue', header: 'Overdue' },
    { key: 'dueSoon', header: 'Due Soon' },
    {
      key: 'workloadScore',
      header: 'Workload Score',
      formatter: (v) => Number(v).toFixed(1),
    },
  ];

  return exportToCSV(data as unknown as Record<string, unknown>[], columns);
}

/**
 * Export ProjectSummary data to CSV
 */
export function exportProjectSummaryCSV(data: ProjectSummary[]): string {
  const columns: ColumnDefinition[] = [
    { key: 'projectName', header: 'Project' },
    { key: 'totalTasks', header: 'Total Tasks' },
    { key: 'completedTasks', header: 'Completed' },
    { key: 'overdueTasks', header: 'Overdue' },
    {
      key: 'completionRate',
      header: 'Completion Rate',
      formatter: (v) => `${(Number(v) * 100).toFixed(1)}%`,
    },
  ];

  return exportToCSV(data as unknown as Record<string, unknown>[], columns);
}

/**
 * Export VelocityReport data to CSV
 */
export function exportVelocityCSV(report: VelocityReport): string {
  const columns: ColumnDefinition[] = [
    { key: 'date', header: 'Date' },
    { key: 'created', header: 'Created' },
    { key: 'completed', header: 'Completed' },
  ];

  // Add summary row at the end
  const dataWithSummary = [
    ...report.data,
    {
      date: `Average (${report.period})`,
      created: Math.round(report.averageVelocity * 10) / 10,
      completed: '-',
    },
  ];

  return exportToCSV(dataWithSummary as unknown as Record<string, unknown>[], columns);
}
