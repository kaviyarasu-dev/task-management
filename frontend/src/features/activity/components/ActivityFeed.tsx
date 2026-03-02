import { useMemo } from 'react';
import { Loader2, History, RefreshCw } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { ActivityItem, ActivityItemCompact } from './ActivityItem';
import { useActivityRealtime } from '../hooks/useActivityRealtime';
import type { Activity } from '../types/activity.types';

interface ActivityFeedProps {
  activities: Activity[];
  isLoading: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  onRefresh?: () => void;
  emptyMessage?: string;
  className?: string;
  compact?: boolean;
  showDividers?: boolean;
  maxHeight?: string;
}

/**
 * Main activity feed container component
 */
export function ActivityFeed({
  activities,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  onRefresh,
  emptyMessage = 'No activity yet',
  className,
  compact = false,
  showDividers = true,
  maxHeight,
}: ActivityFeedProps) {
  // Enable real-time updates
  useActivityRealtime();

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: { date: string; label: string; items: Activity[] }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    activities.forEach((activity) => {
      const activityDate = new Date(activity.occurredAt);
      activityDate.setHours(0, 0, 0, 0);

      let label: string;
      if (activityDate.getTime() === today.getTime()) {
        label = 'Today';
      } else if (activityDate.getTime() === yesterday.getTime()) {
        label = 'Yesterday';
      } else {
        label = activityDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });
      }

      const dateKey = activityDate.toISOString().split('T')[0];
      const existingGroup = groups.find((g) => g.date === dateKey);

      if (existingGroup) {
        existingGroup.items.push(activity);
      } else {
        groups.push({ date: dateKey, label, items: [activity] });
      }
    });

    return groups;
  }, [activities]);

  // Loading state
  if (isLoading && activities.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-12 text-center',
          className
        )}
      >
        <History className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const ItemComponent = compact ? ActivityItemCompact : ActivityItem;

  return (
    <div
      className={cn('space-y-6', className)}
      style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
    >
      {/* Refresh button */}
      {onRefresh && (
        <div className="flex justify-end">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      )}

      {/* Activity list grouped by date */}
      {groupedActivities.map((group) => (
        <div key={group.date}>
          {/* Date header */}
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {group.label}
          </h3>

          {/* Activity items */}
          <div className={cn(showDividers && 'divide-y divide-border')}>
            {group.items.map((activity, index) => (
              <div
                key={activity._id}
                className={cn(
                  showDividers && index !== 0 && 'pt-4',
                  showDividers && index !== group.items.length - 1 && 'pb-4',
                  !showDividers && 'py-2'
                )}
              >
                <ItemComponent activity={activity} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Load more button */}
      {hasNextPage && onLoadMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load more'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Simplified activity list without grouping (for widgets)
 */
export function ActivityList({
  activities,
  isLoading,
  emptyMessage = 'No activity yet',
  className,
  compact = false,
}: Pick<
  ActivityFeedProps,
  'activities' | 'isLoading' | 'emptyMessage' | 'className' | 'compact'
>) {
  if (isLoading && activities.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={cn('py-8 text-center', className)}>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const ItemComponent = compact ? ActivityItemCompact : ActivityItem;

  return (
    <div className={cn('space-y-3', className)}>
      {activities.map((activity) => (
        <ItemComponent key={activity._id} activity={activity} />
      ))}
    </div>
  );
}
