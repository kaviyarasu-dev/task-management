import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/axios';
import type { PaginatedResponse } from '@/shared/types/api.types';
import type { Task } from '@/shared/types/entities.types';

interface CalendarTasksFilters {
  dueDateFrom: string;
  dueDateTo: string;
  projectId?: string;
  assigneeId?: string;
}

async function fetchCalendarTasks(
  filters: CalendarTasksFilters
): Promise<Task[]> {
  const params = new URLSearchParams();
  params.append('dueDateFrom', filters.dueDateFrom);
  params.append('dueDateTo', filters.dueDateTo);
  params.append('limit', '500'); // Get all tasks in range

  if (filters.projectId) {
    params.append('projectId', filters.projectId);
  }
  if (filters.assigneeId) {
    params.append('assigneeId', filters.assigneeId);
  }

  const response = await api.get<PaginatedResponse<Task>>(
    `/tasks?${params.toString()}`
  );
  return response.data.data;
}

export function useCalendarTasks(
  startDate: Date,
  endDate: Date,
  filters?: { projectId?: string; assigneeId?: string }
) {
  return useQuery({
    queryKey: [
      'tasks',
      'calendar',
      startDate.toISOString(),
      endDate.toISOString(),
      filters?.projectId,
      filters?.assigneeId,
    ],
    queryFn: () =>
      fetchCalendarTasks({
        dueDateFrom: startDate.toISOString(),
        dueDateTo: endDate.toISOString(),
        projectId: filters?.projectId,
        assigneeId: filters?.assigneeId,
      }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
