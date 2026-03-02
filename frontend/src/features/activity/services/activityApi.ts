import { api } from '@/shared/lib/axios';
import type { PaginatedResponse } from '@/shared/types/api.types';
import type { Activity, ActivityFilters } from '../types/activity.types';

export const activityApi = {
  /**
   * Get recent activity for the tenant
   */
  getRecent: async (filters: ActivityFilters = {}): Promise<PaginatedResponse<Activity>> => {
    const params = new URLSearchParams();
    if (filters.cursor) params.append('cursor', filters.cursor);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<PaginatedResponse<Activity>>(
      `/activity?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get activity for a specific task
   */
  getByTask: async (
    taskId: string,
    filters: Pick<ActivityFilters, 'cursor' | 'limit'> = {}
  ): Promise<PaginatedResponse<Activity>> => {
    const params = new URLSearchParams();
    if (filters.cursor) params.append('cursor', filters.cursor);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<PaginatedResponse<Activity>>(
      `/activity/tasks/${taskId}?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get activity for a specific project
   */
  getByProject: async (
    projectId: string,
    filters: Pick<ActivityFilters, 'cursor' | 'limit'> = {}
  ): Promise<PaginatedResponse<Activity>> => {
    const params = new URLSearchParams();
    if (filters.cursor) params.append('cursor', filters.cursor);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<PaginatedResponse<Activity>>(
      `/activity/projects/${projectId}?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get activity by a specific user
   */
  getByUser: async (
    userId: string,
    filters: Pick<ActivityFilters, 'cursor' | 'limit'> = {}
  ): Promise<PaginatedResponse<Activity>> => {
    const params = new URLSearchParams();
    if (filters.cursor) params.append('cursor', filters.cursor);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<PaginatedResponse<Activity>>(
      `/activity/users/${userId}?${params.toString()}`
    );
    return response.data;
  },
};
