import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timeTrackingApi } from '../services/timeTrackingApi';
import { useTimerStore } from '../stores/timerStore';
import type { CreateTimeEntryData, UpdateTimeEntryData, StartTimerData } from '../types/timeEntry.types';
import {
  TIME_ENTRIES_QUERY_KEY,
  TIME_ENTRY_QUERY_KEY,
  WEEKLY_REPORT_QUERY_KEY,
  TASK_TIME_TOTAL_QUERY_KEY,
} from './useTimeEntries';

export function useStartTimer() {
  const queryClient = useQueryClient();
  const setActiveEntry = useTimerStore((state) => state.setActiveEntry);

  return useMutation({
    mutationFn: (data: StartTimerData) => timeTrackingApi.startTimer(data),
    onSuccess: (response) => {
      setActiveEntry(response.data);
      queryClient.invalidateQueries({ queryKey: [TIME_ENTRIES_QUERY_KEY] });
    },
  });
}

export function useStopTimer() {
  const queryClient = useQueryClient();
  const { activeEntry, reset } = useTimerStore();

  return useMutation({
    mutationFn: () => {
      if (!activeEntry) {
        throw new Error('No active timer to stop');
      }
      return timeTrackingApi.stopTimer(activeEntry._id);
    },
    onSuccess: () => {
      const taskId = activeEntry?.taskId;
      reset();

      queryClient.invalidateQueries({ queryKey: [TIME_ENTRIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [WEEKLY_REPORT_QUERY_KEY] });

      if (taskId) {
        queryClient.invalidateQueries({ queryKey: [TIME_ENTRIES_QUERY_KEY, 'task', taskId] });
        queryClient.invalidateQueries({ queryKey: [TASK_TIME_TOTAL_QUERY_KEY, taskId] });
      }
    },
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTimeEntryData) => timeTrackingApi.createManual(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [TIME_ENTRIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [WEEKLY_REPORT_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [TIME_ENTRIES_QUERY_KEY, 'task', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: [TASK_TIME_TOTAL_QUERY_KEY, variables.taskId] });
    },
  });
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, data }: { entryId: string; data: UpdateTimeEntryData }) =>
      timeTrackingApi.update(entryId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [TIME_ENTRIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [TIME_ENTRY_QUERY_KEY, variables.entryId] });
      queryClient.invalidateQueries({ queryKey: [WEEKLY_REPORT_QUERY_KEY] });
    },
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => timeTrackingApi.delete(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TIME_ENTRIES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [WEEKLY_REPORT_QUERY_KEY] });
    },
  });
}
