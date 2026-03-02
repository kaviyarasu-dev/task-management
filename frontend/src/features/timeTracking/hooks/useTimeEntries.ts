import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { timeTrackingApi } from '../services/timeTrackingApi';
import type { TimeEntryFilters } from '../types/timeEntry.types';

export const TIME_ENTRIES_QUERY_KEY = 'timeEntries';
export const TIME_ENTRY_QUERY_KEY = 'timeEntry';
export const ACTIVE_TIMER_QUERY_KEY = 'activeTimer';
export const WEEKLY_REPORT_QUERY_KEY = 'weeklyReport';
export const TASK_TIME_TOTAL_QUERY_KEY = 'taskTimeTotal';

export function useTimeEntries(filters: Omit<TimeEntryFilters, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: [TIME_ENTRIES_QUERY_KEY, filters],
    queryFn: ({ pageParam }) =>
      timeTrackingApi.list({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useTaskTimeEntries(taskId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [TIME_ENTRIES_QUERY_KEY, 'task', taskId],
    queryFn: () => timeTrackingApi.listByTask(taskId),
    enabled: options?.enabled ?? !!taskId,
    staleTime: 1000 * 60, // 1 minute
    select: (response) => response.data,
  });
}

export function useTimeEntry(entryId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [TIME_ENTRY_QUERY_KEY, entryId],
    queryFn: () => timeTrackingApi.getById(entryId),
    enabled: options?.enabled ?? !!entryId,
    staleTime: 1000 * 60, // 1 minute
    select: (response) => response.data,
  });
}

export function useWeeklyReport(userId?: string) {
  return useQuery({
    queryKey: [WEEKLY_REPORT_QUERY_KEY, userId],
    queryFn: () => timeTrackingApi.getWeeklyReport(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (response) => response.data,
  });
}

export function useTaskTimeTotal(taskId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [TASK_TIME_TOTAL_QUERY_KEY, taskId],
    queryFn: () => timeTrackingApi.getTaskTotal(taskId),
    enabled: options?.enabled ?? !!taskId,
    staleTime: 1000 * 60, // 1 minute
    select: (response) => response.data,
  });
}
