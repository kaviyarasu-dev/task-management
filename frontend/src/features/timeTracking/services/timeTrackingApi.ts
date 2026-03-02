import { api } from '@/shared/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/shared/types/api.types';
import type {
  TimeEntry,
  TimeEntryFilters,
  CreateTimeEntryData,
  UpdateTimeEntryData,
  StartTimerData,
  WeeklyReport,
  TaskTimeTotal,
} from '../types/timeEntry.types';

export const timeTrackingApi = {
  // Timer endpoints
  startTimer: async (data: StartTimerData): Promise<ApiResponse<TimeEntry>> => {
    const response = await api.post<ApiResponse<TimeEntry>>('/time-entries/start', data);
    return response.data;
  },

  stopTimer: async (entryId: string): Promise<ApiResponse<TimeEntry>> => {
    const response = await api.post<ApiResponse<TimeEntry>>(`/time-entries/stop/${entryId}`);
    return response.data;
  },

  getActiveTimer: async (): Promise<ApiResponse<TimeEntry | null>> => {
    const response = await api.get<ApiResponse<TimeEntry | null>>('/time-entries/active');
    return response.data;
  },

  // CRUD endpoints
  list: async (filters: TimeEntryFilters = {}): Promise<PaginatedResponse<TimeEntry>> => {
    const params = new URLSearchParams();
    if (filters.taskId) params.append('taskId', filters.taskId);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.startedAfter) params.append('startedAfter', filters.startedAfter);
    if (filters.startedBefore) params.append('startedBefore', filters.startedBefore);
    if (filters.billable !== undefined) params.append('billable', String(filters.billable));
    if (filters.cursor) params.append('cursor', filters.cursor);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<PaginatedResponse<TimeEntry>>(`/time-entries?${params.toString()}`);
    return response.data;
  },

  listByTask: async (taskId: string): Promise<ApiResponse<TimeEntry[]>> => {
    const response = await api.get<ApiResponse<TimeEntry[]>>(`/time-entries/task/${taskId}`);
    return response.data;
  },

  getById: async (entryId: string): Promise<ApiResponse<TimeEntry>> => {
    const response = await api.get<ApiResponse<TimeEntry>>(`/time-entries/${entryId}`);
    return response.data;
  },

  createManual: async (data: CreateTimeEntryData): Promise<ApiResponse<TimeEntry>> => {
    const response = await api.post<ApiResponse<TimeEntry>>('/time-entries', data);
    return response.data;
  },

  update: async (entryId: string, data: UpdateTimeEntryData): Promise<ApiResponse<TimeEntry>> => {
    const response = await api.patch<ApiResponse<TimeEntry>>(`/time-entries/${entryId}`, data);
    return response.data;
  },

  delete: async (entryId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/time-entries/${entryId}`);
    return response.data;
  },

  // Reports
  getWeeklyReport: async (userId?: string): Promise<ApiResponse<WeeklyReport>> => {
    const params = userId ? `?userId=${userId}` : '';
    const response = await api.get<ApiResponse<WeeklyReport>>(`/time-entries/report/weekly${params}`);
    return response.data;
  },

  getTaskTotal: async (taskId: string): Promise<ApiResponse<TaskTimeTotal>> => {
    const response = await api.get<ApiResponse<TaskTimeTotal>>(`/time-entries/report/task/${taskId}`);
    return response.data;
  },
};
