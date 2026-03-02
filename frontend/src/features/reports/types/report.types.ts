/**
 * Report types for the Reports page
 */

/** Date range presets for quick selection */
export type DateRangePreset =
  | 'today'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'custom';

/** Date range with optional preset identifier */
export interface ReportDateRange {
  start: string; // ISO date string (YYYY-MM-DD)
  end: string; // ISO date string (YYYY-MM-DD)
  preset?: DateRangePreset;
}

/** Filter state for reports */
export interface ReportFilters {
  dateRange: ReportDateRange;
  projectId?: string;
  userId?: string;
}

/** Available report tabs */
export type ReportTab = 'team' | 'projects' | 'time';

/** CSV column definition for export */
export interface CsvColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => string | number);
}

/** Team performance row data */
export interface TeamPerformanceRow {
  userId: string;
  userName: string;
  email: string;
  completedTasks: number;
  totalTasks: number;
  overdueTasks: number;
  onTimePercentage: number;
  completionRate: number;
}

/** Project progress row data */
export interface ProjectProgressRow {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
}

/** Time summary row data */
export interface TimeSummaryRow {
  userId: string;
  userName: string;
  totalMinutes: number;
  billableMinutes: number;
  taskCount: number;
}

/** Date range preset option */
export interface PresetOption {
  value: DateRangePreset;
  label: string;
}

/** Date range presets configuration */
export const DATE_RANGE_PRESETS: PresetOption[] = [
  { value: 'today', label: 'Today' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisQuarter', label: 'This Quarter' },
  { value: 'custom', label: 'Custom' },
];
