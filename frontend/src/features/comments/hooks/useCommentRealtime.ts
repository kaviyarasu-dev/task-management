import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/shared/lib/socket';
import { commentKeys } from './useComments';

interface CommentCreatedEvent {
  commentId: string;
  taskId: string;
}

interface CommentUpdatedEvent {
  commentId: string;
  taskId: string;
}

interface CommentDeletedEvent {
  commentId: string;
  taskId: string;
}

/**
 * Hook to subscribe to real-time comment updates for a specific task
 */
export function useCommentRealtime(taskId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!taskId) return;

    const socket = getSocket();
    if (!socket) return;

    const handleCommentCreated = (data: CommentCreatedEvent) => {
      if (data.taskId === taskId) {
        queryClient.invalidateQueries({ queryKey: commentKeys.byTask(taskId) });
      }
    };

    const handleCommentUpdated = (data: CommentUpdatedEvent) => {
      if (data.taskId === taskId) {
        queryClient.invalidateQueries({ queryKey: commentKeys.byTask(taskId) });
      }
    };

    const handleCommentDeleted = (data: CommentDeletedEvent) => {
      if (data.taskId === taskId) {
        queryClient.invalidateQueries({ queryKey: commentKeys.byTask(taskId) });
      }
    };

    socket.on('comment:created', handleCommentCreated);
    socket.on('comment:updated', handleCommentUpdated);
    socket.on('comment:deleted', handleCommentDeleted);

    return () => {
      socket.off('comment:created', handleCommentCreated);
      socket.off('comment:updated', handleCommentUpdated);
      socket.off('comment:deleted', handleCommentDeleted);
    };
  }, [taskId, queryClient]);
}
