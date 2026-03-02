import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '../services/analyticsApi';
import type {
  MetricFilters,
  DateRange,
  VelocityPeriod,
} from '../types/analytics.types';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Query keys for analytics
 */
export const analyticsKeys = {
  all: ['analytics'] as const,
  metrics: (filters?: MetricFilters) => [...analyticsKeys.all, 'metrics', filters] as const,
  velocity: (period: VelocityPeriod, range?: DateRange) =>
    [...analyticsKeys.all, 'velocity', period, range] as const,
  completionTime: (filters?: MetricFilters) =>
    [...analyticsKeys.all, 'completionTime', filters] as const,
  projectSummaries: () => [...analyticsKeys.all, 'projectSummaries'] as const,
  userProductivity: (range?: DateRange) =>
    [...analyticsKeys.all, 'userProductivity', range] as const,
  teamWorkload: () => [...analyticsKeys.all, 'teamWorkload'] as const,
};

/**
 * Fetch task metrics
 */
export function useTaskMetrics(filters?: MetricFilters) {
  return useQuery({
    queryKey: analyticsKeys.metrics(filters),
    queryFn: async () => {
      const response = await analyticsApi.getTaskMetrics(filters);
      return response.data;
    },
    staleTime: STALE_TIME,
  });
}

/**
 * Fetch velocity report
 */
export function useVelocity(period: VelocityPeriod = 'weekly', range?: DateRange) {
  return useQuery({
    queryKey: analyticsKeys.velocity(period, range),
    queryFn: async () => {
      const response = await analyticsApi.getVelocity(period, range);
      return response.data;
    },
    staleTime: STALE_TIME,
  });
}

/**
 * Fetch average completion time
 */
export function useCompletionTime(filters?: MetricFilters) {
  return useQuery({
    queryKey: analyticsKeys.completionTime(filters),
    queryFn: async () => {
      const response = await analyticsApi.getCompletionTime(filters);
      return response.data;
    },
    staleTime: STALE_TIME,
  });
}

/**
 * Fetch project summaries
 */
export function useProjectSummaries() {
  return useQuery({
    queryKey: analyticsKeys.projectSummaries(),
    queryFn: async () => {
      const response = await analyticsApi.getProjectSummaries();
      return response.data;
    },
    staleTime: STALE_TIME,
  });
}

/**
 * Fetch user productivity (admin/owner only)
 */
export function useUserProductivity(range?: DateRange) {
  return useQuery({
    queryKey: analyticsKeys.userProductivity(range),
    queryFn: async () => {
      const response = await analyticsApi.getUserProductivity(range);
      return response.data;
    },
    staleTime: STALE_TIME,
  });
}

/**
 * Fetch team workload (admin/owner only)
 */
export function useTeamWorkload() {
  return useQuery({
    queryKey: analyticsKeys.teamWorkload(),
    queryFn: async () => {
      const response = await analyticsApi.getTeamWorkload();
      return response.data;
    },
    staleTime: STALE_TIME,
  });
}

/**
 * Invalidate cache mutation
 */
export function useInvalidateAnalyticsCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: analyticsApi.invalidateCache,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
  });
}
