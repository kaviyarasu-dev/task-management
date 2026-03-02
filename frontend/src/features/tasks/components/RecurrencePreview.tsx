import { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { cn, formatDate } from '@/shared/lib/utils';
import type { RecurrencePattern, DayOfWeek } from '../types/recurrence.types';

interface RecurrencePreviewProps {
  pattern: RecurrencePattern;
  startDate?: Date;
  count?: number;
  className?: string;
}

/**
 * Calculate next occurrences for a recurrence pattern
 */
function calculateNextOccurrences(
  pattern: RecurrencePattern,
  startDate: Date,
  count: number
): Date[] {
  const occurrences: Date[] = [];
  let currentDate = new Date(startDate);
  let iterationLimit = 365; // Safety limit

  while (occurrences.length < count && iterationLimit > 0) {
    iterationLimit--;
    const nextDate = getNextOccurrence(pattern, currentDate);

    if (!nextDate) break;

    // Check end conditions
    if (pattern.endDate && nextDate > new Date(pattern.endDate)) break;
    if (pattern.endAfterCount && occurrences.length >= pattern.endAfterCount) break;

    occurrences.push(nextDate);
    currentDate = new Date(nextDate);
    currentDate.setDate(currentDate.getDate() + 1); // Move to next day for iteration
  }

  return occurrences;
}

/**
 * Get the next occurrence date from a given start date
 */
function getNextOccurrence(pattern: RecurrencePattern, fromDate: Date): Date | null {
  const { type, interval, daysOfWeek, dayOfMonth } = pattern;
  const result = new Date(fromDate);

  switch (type) {
    case 'daily':
      // For daily, just add the interval
      result.setDate(result.getDate() + interval);
      return result;

    case 'weekly':
      if (daysOfWeek && daysOfWeek.length > 0) {
        // Find next matching day
        const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
        const currentDay = result.getDay() as DayOfWeek;

        // Look for next day this week
        for (const day of sortedDays) {
          if (day > currentDay) {
            result.setDate(result.getDate() + (day - currentDay));
            return result;
          }
        }

        // No day found this week, go to first day of next occurrence
        const daysUntilFirstDay = 7 - currentDay + sortedDays[0];
        const weeksToAdd = (interval - 1) * 7;
        result.setDate(result.getDate() + daysUntilFirstDay + weeksToAdd);
        return result;
      } else {
        // Just add weeks
        result.setDate(result.getDate() + interval * 7);
        return result;
      }

    case 'monthly':
      const targetDay = dayOfMonth ?? result.getDate();

      // Move to next month
      result.setMonth(result.getMonth() + interval);

      // Handle end of month edge cases
      const daysInMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
      result.setDate(Math.min(targetDay, daysInMonth));

      return result;

    case 'custom':
      // For custom, default to daily behavior
      result.setDate(result.getDate() + interval);
      return result;

    default:
      return null;
  }
}

/**
 * Preview component showing upcoming occurrences
 */
export function RecurrencePreview({
  pattern,
  startDate = new Date(),
  count = 5,
  className,
}: RecurrencePreviewProps) {
  const occurrences = useMemo(
    () => calculateNextOccurrences(pattern, startDate, count),
    [pattern, startDate, count]
  );

  if (occurrences.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        No upcoming occurrences
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Calendar className="h-3 w-3" />
        Next occurrences:
      </div>
      <ul className="space-y-0.5 pl-4">
        {occurrences.map((date, index) => (
          <li
            key={date.toISOString()}
            className={cn(
              'text-xs',
              index === 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}
          >
            {formatOccurrenceDate(date)}
          </li>
        ))}
      </ul>
      {pattern.endAfterCount && (
        <div className="text-xs text-muted-foreground italic">
          {pattern.endAfterCount - occurrences.length > 0
            ? `+${pattern.endAfterCount - occurrences.length} more`
            : 'Last occurrence shown'}
        </div>
      )}
    </div>
  );
}

/**
 * Format occurrence date with relative indicator
 */
function formatOccurrenceDate(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) {
    return `Today (${formatDate(date.toISOString())})`;
  }

  if (dateOnly.getTime() === tomorrow.getTime()) {
    return `Tomorrow (${formatDate(date.toISOString())})`;
  }

  const daysDiff = Math.ceil((dateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 7) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName} (${formatDate(date.toISOString())})`;
  }

  return formatDate(date.toISOString());
}
