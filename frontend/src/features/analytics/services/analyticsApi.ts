import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  TaskMetrics,
  VelocityReport,
  VelocityPeriod,
  UserProductivity,
  MetricFilters,
  DateRange,
  ProjectSummary,
  TeamWorkload,
} from '../types/analytics.types';

export const analyticsApi = {
  /**
   * Get task metrics including status/priority distribution
   */
  getTaskMetrics: async (filters?: MetricFilters): Promise<ApiResponse<TaskMetrics>> => {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.assigneeId) params.append('assigneeId', filters.assigneeId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get<ApiResponse<TaskMetrics>>(
      `/reports/tasks/metrics?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get task velocity (created vs completed over time)
   */
  getVelocity: async (
    period: VelocityPeriod = 'weekly',
    range?: DateRange
  ): Promise<ApiResponse<VelocityReport>> => {
    const params = new URLSearchParams({ period });
    if (range?.start) params.append('start', range.start);
    if (range?.end) params.append('end', range.end);

    const response = await api.get<ApiResponse<VelocityReport>>(
      `/reports/tasks/velocity?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get average task completion time
   */
  getCompletionTime: async (
    filters?: MetricFilters
  ): Promise<ApiResponse<{ averageHours: number }>> => {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);

    const response = await api.get<ApiResponse<{ averageHours: number }>>(
      `/reports/tasks/completion-time?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get project summaries
   */
  getProjectSummaries: async (): Promise<ApiResponse<ProjectSummary[]>> => {
    const response = await api.get<ApiResponse<ProjectSummary[]>>('/reports/projects/summary');
    return response.data;
  },

  /**
   * Get user productivity metrics (admin/owner only)
   */
  getUserProductivity: async (range?: DateRange): Promise<ApiResponse<UserProductivity[]>> => {
    const params = new URLSearchParams();
    if (range?.start) params.append('start', range.start);
    if (range?.end) params.append('end', range.end);

    const response = await api.get<ApiResponse<UserProductivity[]>>(
      `/reports/users/productivity?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get team workload distribution (admin/owner only)
   */
  getTeamWorkload: async (): Promise<ApiResponse<TeamWorkload[]>> => {
    const response = await api.get<ApiResponse<TeamWorkload[]>>('/reports/team/workload');
    return response.data;
  },

  /**
   * Invalidate report cache (admin/owner only)
   */
  invalidateCache: async (): Promise<void> => {
    await api.post('/reports/cache/invalidate');
  },
};
