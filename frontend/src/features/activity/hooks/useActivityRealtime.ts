import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/shared/contexts/SocketContext';
import type { Activity } from '../types/activity.types';

interface ActivityCreatedPayload {
  activity: Activity;
}

/**
 * Hook to handle real-time activity updates
 * Invalidates activity queries when new activities are created
 */
export function useActivityRealtime() {
  const { on, off, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isConnected) return;

    const handleActivityCreated = (payload: ActivityCreatedPayload) => {
      console.log('[Realtime] Activity created:', payload.activity._id);

      // Invalidate all activity queries
      queryClient.invalidateQueries({ queryKey: ['activities'] });

      // If activity is related to a specific task, invalidate task activities
      if (payload.activity.entityType === 'task') {
        queryClient.invalidateQueries({
          queryKey: ['activities', 'task', payload.activity.entityId],
        });
      }

      // If activity is related to a specific project, invalidate project activities
      if (payload.activity.entityType === 'project') {
        queryClient.invalidateQueries({
          queryKey: ['activities', 'project', payload.activity.entityId],
        });
      }
    };

    on('activity:created' as never, handleActivityCreated as never);

    return () => {
      off('activity:created' as never, handleActivityCreated as never);
    };
  }, [isConnected, on, off, queryClient]);
}

/**
 * Hook for real-time updates for a specific task's activity
 */
export function useTaskActivityRealtime(taskId: string) {
  const { on, off, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isConnected || !taskId) return;

    const handleActivityCreated = (payload: ActivityCreatedPayload) => {
      // Only invalidate if activity is for this task
      if (
        payload.activity.entityType === 'task' &&
        payload.activity.entityId === taskId
      ) {
        console.log('[Realtime] Task activity created:', payload.activity._id);
        queryClient.invalidateQueries({
          queryKey: ['activities', 'task', taskId],
        });
      }
    };

    on('activity:created' as never, handleActivityCreated as never);

    return () => {
      off('activity:created' as never, handleActivityCreated as never);
    };
  }, [isConnected, taskId, on, off, queryClient]);
}

/**
 * Hook for real-time updates for a specific project's activity
 */
export function useProjectActivityRealtime(projectId: string) {
  const { on, off, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isConnected || !projectId) return;

    const handleActivityCreated = (payload: ActivityCreatedPayload) => {
      // Only invalidate if activity is for this project
      if (
        payload.activity.entityType === 'project' &&
        payload.activity.entityId === projectId
      ) {
        console.log('[Realtime] Project activity created:', payload.activity._id);
        queryClient.invalidateQueries({
          queryKey: ['activities', 'project', projectId],
        });
      }
    };

    on('activity:created' as never, handleActivityCreated as never);

    return () => {
      off('activity:created' as never, handleActivityCreated as never);
    };
  }, [isConnected, projectId, on, off, queryClient]);
}
