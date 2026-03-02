import { useEffect } from 'react';
import { useTimerStore } from '../stores/timerStore';

/**
 * Hook to fetch and sync the active timer on mount.
 * Should be used once in the app (e.g., in AppLayout or Header).
 */
export function useActiveTimerSync() {
  const fetchActiveTimer = useTimerStore((state) => state.fetchActiveTimer);
  const reset = useTimerStore((state) => state.reset);

  useEffect(() => {
    // Fetch active timer on mount
    fetchActiveTimer();

    // Cleanup interval on unmount
    return () => {
      reset();
    };
  }, [fetchActiveTimer, reset]);
}

/**
 * Hook to access the active timer state and actions.
 */
export function useActiveTimer() {
  const activeEntry = useTimerStore((state) => state.activeEntry);
  const elapsedSeconds = useTimerStore((state) => state.elapsedSeconds);
  const isRunning = useTimerStore((state) => state.isRunning);
  const isLoading = useTimerStore((state) => state.isLoading);
  const error = useTimerStore((state) => state.error);
  const start = useTimerStore((state) => state.start);
  const stop = useTimerStore((state) => state.stop);

  return {
    activeEntry,
    elapsedSeconds,
    isRunning,
    isLoading,
    error,
    start,
    stop,
  };
}

/**
 * Hook to check if a specific task has an active timer.
 */
export function useIsTaskTimerActive(taskId: string): boolean {
  const activeEntry = useTimerStore((state) => state.activeEntry);
  return activeEntry?.taskId === taskId;
}
