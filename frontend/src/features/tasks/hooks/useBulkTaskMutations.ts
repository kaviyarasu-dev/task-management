import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '../services/taskApi';
import { toast } from '@/shared/stores/toastStore';

export function useBulkTaskMutations() {
  const queryClient = useQueryClient();

  const bulkUpdateStatus = useMutation({
    mutationFn: ({
      taskIds,
      statusId,
    }: {
      taskIds: string[];
      statusId: string;
    }) => taskApi.bulkUpdateStatus(taskIds, statusId),
    onSuccess: (_, { taskIds }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        type: 'success',
        title: `Updated ${taskIds.length} tasks`,
      });
    },
    onError: () => {
      toast({
        type: 'error',
        title: 'Failed to update tasks',
      });
    },
  });

  const bulkDelete = useMutation({
    mutationFn: (taskIds: string[]) => taskApi.bulkDelete(taskIds),
    onSuccess: (_, taskIds) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        type: 'success',
        title: `Deleted ${taskIds.length} tasks`,
      });
    },
    onError: () => {
      toast({
        type: 'error',
        title: 'Failed to delete tasks',
      });
    },
  });

  const bulkAssign = useMutation({
    mutationFn: ({
      taskIds,
      assigneeId,
    }: {
      taskIds: string[];
      assigneeId: string | null;
    }) => taskApi.bulkAssign(taskIds, assigneeId),
    onSuccess: (_, { taskIds }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        type: 'success',
        title: `Updated ${taskIds.length} tasks`,
      });
    },
    onError: () => {
      toast({
        type: 'error',
        title: 'Failed to assign tasks',
      });
    },
  });

  return { bulkUpdateStatus, bulkDelete, bulkAssign };
}
