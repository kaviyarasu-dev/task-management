import { RefreshCw } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { RecurrencePattern, DayOfWeek } from '../types/recurrence.types';
import { DAY_OF_WEEK_NAMES, DAY_OF_WEEK_SHORT_NAMES } from '../types/recurrence.types';

interface RecurrenceDisplayProps {
  pattern: RecurrencePattern;
  showIcon?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Format ordinal suffix (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Generate human-readable recurrence description
 */
export function getRecurrenceDescription(pattern: RecurrencePattern, compact = false): string {
  const { type, interval, daysOfWeek, dayOfMonth, endDate, endAfterCount } = pattern;

  let description = '';

  switch (type) {
    case 'daily':
      if (interval === 1) {
        description = compact ? 'Daily' : 'Every day';
      } else {
        description = `Every ${interval} days`;
      }
      break;

    case 'weekly':
      if (interval === 1) {
        if (daysOfWeek && daysOfWeek.length > 0) {
          // Check for common patterns
          const weekdays = [1, 2, 3, 4, 5];
          const isWeekdays =
            daysOfWeek.length === 5 &&
            weekdays.every((d) => daysOfWeek.includes(d as DayOfWeek));

          if (isWeekdays) {
            description = compact ? 'Weekdays' : 'Every weekday';
          } else {
            const dayNames = daysOfWeek
              .sort((a, b) => a - b)
              .map((d) => (compact ? DAY_OF_WEEK_SHORT_NAMES[d] : DAY_OF_WEEK_NAMES[d]));

            if (compact) {
              description = dayNames.join(', ');
            } else {
              description = `Every week on ${formatDayList(dayNames)}`;
            }
          }
        } else {
          description = compact ? 'Weekly' : 'Every week';
        }
      } else {
        if (daysOfWeek && daysOfWeek.length > 0) {
          const dayNames = daysOfWeek
            .sort((a, b) => a - b)
            .map((d) => (compact ? DAY_OF_WEEK_SHORT_NAMES[d] : DAY_OF_WEEK_NAMES[d]));
          description = compact
            ? `Every ${interval} wks (${dayNames.join(', ')})`
            : `Every ${interval} weeks on ${formatDayList(dayNames)}`;
        } else {
          description = `Every ${interval} weeks`;
        }
      }
      break;

    case 'monthly':
      if (interval === 1) {
        if (dayOfMonth) {
          description = compact
            ? `Monthly (${getOrdinalSuffix(dayOfMonth)})`
            : `Every month on the ${getOrdinalSuffix(dayOfMonth)}`;
        } else {
          description = compact ? 'Monthly' : 'Every month';
        }
      } else {
        if (dayOfMonth) {
          description = `Every ${interval} months on the ${getOrdinalSuffix(dayOfMonth)}`;
        } else {
          description = `Every ${interval} months`;
        }
      }
      break;

    case 'custom':
      description = compact ? 'Custom' : 'Custom recurrence';
      break;
  }

  // Add end condition (only for non-compact)
  if (!compact) {
    if (endDate) {
      const date = new Date(endDate);
      description += `, until ${date.toLocaleDateString()}`;
    } else if (endAfterCount) {
      description += `, ${endAfterCount} times`;
    }
  }

  return description;
}

/**
 * Format a list of day names with proper grammar
 */
function formatDayList(days: string[]): string {
  if (days.length === 1) return days[0];
  if (days.length === 2) return `${days[0]} and ${days[1]}`;
  return `${days.slice(0, -1).join(', ')}, and ${days[days.length - 1]}`;
}

/**
 * Display component for recurrence pattern
 */
export function RecurrenceDisplay({
  pattern,
  showIcon = true,
  compact = false,
  className,
}: RecurrenceDisplayProps) {
  const description = getRecurrenceDescription(pattern, compact);

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {showIcon && (
        <RefreshCw className={cn('text-muted-foreground', compact ? 'h-3 w-3' : 'h-4 w-4')} />
      )}
      <span className={cn(compact ? 'text-xs' : 'text-sm')}>{description}</span>
    </span>
  );
}
