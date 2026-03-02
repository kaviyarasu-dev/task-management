/**
 * Report types for task metrics and analytics
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

export interface VelocityReport {
  period: VelocityPeriod;
  data: VelocityDataPoint[];
  averageVelocity: number;
}

export type VelocityPeriod = 'daily' | 'weekly' | 'monthly';

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
  startDate?: Date;
  endDate?: Date;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
}

/**
 * Team workload analytics per user
 */
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

/**
 * Project health metrics
 */
export interface ProjectHealth {
  projectId: string;
  healthScore: number;
  healthStatus: HealthStatus;
  total: number;
  completed: number;
  overdue: number;
  blocked: number;
  completionPercentage: number;
  statusDistribution: StatusCount[];
  recentActivity: RecentActivityItem[];
}

export type HealthStatus = 'healthy' | 'at-risk' | 'critical';

export interface RecentActivityItem {
  title: string;
  status: {
    name: string;
    color: string;
  };
  updatedAt: Date;
}

/**
 * Burndown chart data
 */
export interface BurndownData {
  startDate: Date;
  endDate: Date;
  totalAtStart: number;
  data: BurndownPoint[];
  idealBurndown: BurndownPoint[];
}

export interface BurndownPoint {
  date: string;
  remaining: number;
  added?: number;
  completed?: number;
}
