import { useState } from 'react';
import { Clock, Trash2, DollarSign, Loader2 } from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import { useTaskTimeEntries, useTaskTimeTotal } from '../hooks/useTimeEntries';
import { useDeleteTimeEntry } from '../hooks/useTimeTrackingMutations';
import { formatMinutes } from './TimeDisplay';
import type { TimeEntry } from '../types/timeEntry.types';

interface TimeEntryListProps {
  taskId: string;
  className?: string;
  showTotal?: boolean;
}

interface TimeEntryRowProps {
  entry: TimeEntry;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function TimeEntryRow({ entry, onDelete, isDeleting }: TimeEntryRowProps) {
  const startDate = new Date(entry.startedAt);
  const endDate = entry.endedAt ? new Date(entry.endedAt) : null;

  // Calculate duration
  const durationMinutes = entry.durationMinutes ??
    (endDate ? Math.round((endDate.getTime() - startDate.getTime()) / 60000) : 0);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground truncate">
            {entry.description || 'No description'}
          </span>
          {entry.billable && (
            <span title="Billable">
              <DollarSign className="h-3 w-3 text-green-600 flex-shrink-0" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatDate(entry.startedAt)}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(startDate)} - {endDate ? formatTime(endDate) : 'Running'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-3">
        <span className="font-mono text-sm font-medium tabular-nums text-foreground">
          {formatMinutes(durationMinutes)}
        </span>

        <button
          onClick={() => onDelete(entry._id)}
          disabled={isDeleting}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-50"
          title="Delete entry"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export function TimeEntryList({ taskId, className, showTotal = true }: TimeEntryListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: entries, isLoading, error } = useTaskTimeEntries(taskId);
  const { data: totalData } = useTaskTimeTotal(taskId, { enabled: showTotal });
  const deleteEntry = useDeleteTimeEntry();

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) {
      return;
    }

    setDeletingId(entryId);
    try {
      await deleteEntry.mutateAsync(entryId);
    } catch {
      // Error handled by mutation
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-4', className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('py-4 text-center text-sm text-destructive', className)}>
        Failed to load time entries
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className={cn('py-4 text-center', className)}>
        <Clock className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">No time entries yet</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Total Summary */}
      {showTotal && totalData && (
        <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
          <span className="text-sm font-medium text-foreground">Total Time</span>
          <span className="font-mono text-sm font-semibold tabular-nums text-primary">
            {formatMinutes(totalData.totalMinutes)}
          </span>
        </div>
      )}

      {/* Entry List */}
      <div className="space-y-2">
        {entries.map((entry) => (
          <TimeEntryRow
            key={entry._id}
            entry={entry}
            onDelete={handleDelete}
            isDeleting={deletingId === entry._id}
          />
        ))}
      </div>
    </div>
  );
}
