// Components
export { TaskStatusChart } from './components/TaskStatusChart';
export { TaskTrendChart } from './components/TaskTrendChart';
export { ProductivityChart } from './components/ProductivityChart';
export { PriorityDistribution } from './components/PriorityDistribution';
export { DueDateTimeline } from './components/DueDateTimeline';
export { ChartSkeleton } from './components/ChartSkeleton';

// Hooks
export {
  useTaskMetrics,
  useVelocity,
  useCompletionTime,
  useProjectSummaries,
  useUserProductivity,
  useTeamWorkload,
  useInvalidateAnalyticsCache,
  analyticsKeys,
} from './hooks/useAnalytics';

// Services
export { analyticsApi } from './services/analyticsApi';

// Types
export type {
  StatusCount,
  PriorityCount,
  TaskMetrics,
  VelocityDataPoint,
  VelocityPeriod,
  VelocityReport,
  UserProductivity,
  MetricFilters,
  DateRange,
  ProjectSummary,
  TeamWorkload,
  DueTask,
} from './types/analytics.types';

export { PRIORITY_COLORS, PRIORITY_ORDER } from './types/analytics.types';
