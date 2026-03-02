/**
 * Analytics types for dashboard charts and reports
 */

export interface StatusCount {
  statusId: string;
  name: string;
  color: string;
  count: number;
}

export interface PriorityCount {
  priority: string;
  count: number;
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueCount: number;
  completedThisWeek: number;
  averageCompletionTimeHours: number;
  statusDistribution: StatusCount[];
  priorityDistribution: PriorityCount[];
}

export interface VelocityDataPoint {
  date: string;
  created: number;
  completed: number;
}

export type VelocityPeriod = 'daily' | 'weekly' | 'monthly';

export interface VelocityReport {
  period: VelocityPeriod;
  data: VelocityDataPoint[];
  averageVelocity: number;
}

export interface UserProductivity {
  userId: string;
  userName: string;
  userEmail: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  onTimePercentage: number;
}

export interface MetricFilters {
  projectId?: string;
  assigneeId?: string;
  startDate?: string;
  endDate?: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface TeamWorkload {
  userId: string;
  userName: string;
  userEmail: string;
  totalTasks: number;
  highPriority: number;
  urgent: number;
  overdue: number;
  dueSoon: number;
  workloadScore: number;
}

export interface DueTask {
  _id: string;
  title: string;
  dueDate: string;
  priority: string;
  projectName?: string;
}

// Priority configuration for consistent colors
export const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

export const PRIORITY_ORDER = ['urgent', 'high', 'medium', 'low'] as const;
