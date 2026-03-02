import { useState } from 'react';
import { Play, Square, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useActiveTimer, useIsTaskTimerActive } from '../hooks/useActiveTimer';
import { useStartTimer, useStopTimer } from '../hooks/useTimeTrackingMutations';
import { formatTimerDisplay } from './TimeDisplay';

interface TimeTrackerProps {
  taskId: string;
  className?: string;
  variant?: 'default' | 'compact';
}

export function TimeTracker({ taskId, className, variant = 'default' }: TimeTrackerProps) {
  const [description, setDescription] = useState('');
  const { activeEntry, elapsedSeconds, isRunning, isLoading: storeLoading } = useActiveTimer();
  const isThisTaskActive = useIsTaskTimerActive(taskId);

  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();

  const isLoading = storeLoading || startTimer.isPending || stopTimer.isPending;
  const hasOtherActiveTimer = isRunning && !isThisTaskActive;

  const handleStart = async () => {
    try {
      await startTimer.mutateAsync({ taskId, description: description || undefined });
      setDescription('');
    } catch {
      // Error handled by mutation
    }
  };

  const handleStop = async () => {
    try {
      await stopTimer.mutateAsync();
    } catch {
      // Error handled by mutation
    }
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {isThisTaskActive ? (
          <>
            <span className="font-mono text-sm tabular-nums text-primary">
              {formatTimerDisplay(elapsedSeconds)}
            </span>
            <button
              onClick={handleStop}
              disabled={isLoading}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              title="Stop timer"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Square className="h-3.5 w-3.5" />
              )}
            </button>
          </>
        ) : (
          <button
            onClick={handleStart}
            disabled={isLoading || hasOtherActiveTimer}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50',
              hasOtherActiveTimer && 'cursor-not-allowed'
            )}
            title={hasOtherActiveTimer ? 'Stop other timer first' : 'Start timer'}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Timer Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isThisTaskActive && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="font-mono text-lg font-semibold tabular-nums text-primary">
                {formatTimerDisplay(elapsedSeconds)}
              </span>
            </div>
          )}

          {!isThisTaskActive && !hasOtherActiveTimer && (
            <span className="text-sm text-muted-foreground">No active timer</span>
          )}

          {hasOtherActiveTimer && (
            <span className="text-sm text-amber-600">
              Timer running on another task
            </span>
          )}
        </div>

        {/* Start/Stop Button */}
        {isThisTaskActive ? (
          <button
            onClick={handleStop}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            Stop
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={isLoading || hasOtherActiveTimer}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Start
          </button>
        )}
      </div>

      {/* Description Input (only when not running) */}
      {!isThisTaskActive && !hasOtherActiveTimer && (
        <input
          type="text"
          placeholder="What are you working on? (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}

      {/* Current description display */}
      {isThisTaskActive && activeEntry?.description && (
        <p className="text-sm text-muted-foreground">
          {activeEntry.description}
        </p>
      )}
    </div>
  );
}
