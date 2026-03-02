import { useInfiniteQuery } from '@tanstack/react-query';
import { commentApi } from '../services/commentApi';
import type { CommentFilters } from '../types/comment.types';

/**
 * Query key factory for comments
 */
export const commentKeys = {
  all: ['comments'] as const,
  byTask: (taskId: string) => [...commentKeys.all, 'task', taskId] as const,
  byTaskFiltered: (taskId: string, filters: Omit<CommentFilters, 'cursor'>) =>
    [...commentKeys.byTask(taskId), filters] as const,
  detail: (commentId: string) => [...commentKeys.all, 'detail', commentId] as const,
};

/**
 * Hook to fetch comments for a task with infinite scroll support
 */
export function useComments(
  taskId: string | undefined,
  filters: Omit<CommentFilters, 'cursor'> = {}
) {
  return useInfiniteQuery({
    queryKey: commentKeys.byTaskFiltered(taskId ?? '', filters),
    queryFn: ({ pageParam }) =>
      commentApi.listByTask(taskId!, { ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(taskId),
    staleTime: 1000 * 30, // 30 seconds - comments refresh more often
  });
}
