import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { activityApi } from '../services/activityApi';
import type { ActivityFilters } from '../types/activity.types';

/**
 * Hook for fetching recent activity with infinite scrolling
 */
export function useActivities(filters: Omit<ActivityFilters, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: ['activities', filters],
    queryFn: ({ pageParam }) =>
      activityApi.getRecent({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 30, // 30 seconds - activity should be fairly fresh
  });
}

/**
 * Hook for fetching task-specific activity with infinite scrolling
 */
export function useTaskActivities(
  taskId: string,
  options: { enabled?: boolean; limit?: number } = {}
) {
  const { enabled = true, limit } = options;

  return useInfiniteQuery({
    queryKey: ['activities', 'task', taskId],
    queryFn: ({ pageParam }) =>
      activityApi.getByTask(taskId, { cursor: pageParam, limit }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: enabled && !!taskId,
    staleTime: 1000 * 30,
  });
}

/**
 * Hook for fetching project-specific activity with infinite scrolling
 */
export function useProjectActivities(
  projectId: string,
  options: { enabled?: boolean; limit?: number } = {}
) {
  const { enabled = true, limit } = options;

  return useInfiniteQuery({
    queryKey: ['activities', 'project', projectId],
    queryFn: ({ pageParam }) =>
      activityApi.getByProject(projectId, { cursor: pageParam, limit }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: enabled && !!projectId,
    staleTime: 1000 * 30,
  });
}

/**
 * Hook for fetching user-specific activity with infinite scrolling
 */
export function useUserActivities(
  userId: string,
  options: { enabled?: boolean; limit?: number } = {}
) {
  const { enabled = true, limit } = options;

  return useInfiniteQuery({
    queryKey: ['activities', 'user', userId],
    queryFn: ({ pageParam }) =>
      activityApi.getByUser(userId, { cursor: pageParam, limit }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: enabled && !!userId,
    staleTime: 1000 * 30,
  });
}

/**
 * Hook for fetching a limited number of recent activities (for widgets)
 */
export function useRecentActivities(limit: number = 10) {
  return useQuery({
    queryKey: ['activities', 'recent', limit],
    queryFn: async () => {
      const response = await activityApi.getRecent({ limit });
      return response.data;
    },
    staleTime: 1000 * 30,
  });
}
