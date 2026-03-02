export interface TimeEntry {
  _id: string;
  taskId: string;
  userId: string;
  description?: string;
  startedAt: string;
  endedAt?: string;
  durationMinutes?: number;
  billable: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntryWithTask extends TimeEntry {
  task?: {
    _id: string;
    title: string;
  };
}

export interface TimeEntryFilters {
  taskId?: string;
  userId?: string;
  startedAfter?: string;
  startedBefore?: string;
  billable?: boolean;
  cursor?: string;
  limit?: number;
}

export interface CreateTimeEntryData {
  taskId: string;
  description?: string;
  startedAt: string;
  endedAt: string;
  durationMinutes?: number;
  billable?: boolean;
}

export interface UpdateTimeEntryData {
  description?: string;
  startedAt?: string;
  endedAt?: string;
  durationMinutes?: number;
  billable?: boolean;
}

export interface StartTimerData {
  taskId: string;
  description?: string;
}

export interface WeeklyReportEntry {
  date: string;
  totalMinutes: number;
  entries: TimeEntry[];
}

export interface WeeklyReport {
  userId: string;
  weekStart: string;
  weekEnd: string;
  totalMinutes: number;
  dailyBreakdown: WeeklyReportEntry[];
}

export interface TaskTimeTotal {
  taskId: string;
  totalMinutes: number;
}
