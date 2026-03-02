import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi } from '../services/commentApi';
import { commentKeys } from './useComments';
import type { CreateCommentData, UpdateCommentData } from '../types/comment.types';

/**
 * Hook for creating a new comment
 */
export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentData) => commentApi.create(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byTask(taskId) });
    },
  });
}

/**
 * Hook for updating an existing comment
 */
export function useUpdateComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      data,
    }: {
      commentId: string;
      data: UpdateCommentData;
    }) => commentApi.update(commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byTask(taskId) });
    },
  });
}

/**
 * Hook for deleting a comment
 */
export function useDeleteComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentApi.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byTask(taskId) });
    },
  });
}
