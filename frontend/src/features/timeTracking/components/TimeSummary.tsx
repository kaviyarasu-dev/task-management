import { Clock, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useWeeklyReport } from '../hooks/useTimeEntries';
import { formatMinutes } from './TimeDisplay';

interface TimeSummaryProps {
  userId?: string;
  className?: string;
  variant?: 'card' | 'inline';
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TimeSummary({ userId, className, variant = 'card' }: TimeSummaryProps) {
  const { data: report, isLoading, error } = useWeeklyReport(userId);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('py-4 text-center text-sm text-destructive', className)}>
        Failed to load time summary
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const weekStart = new Date(report.weekStart);
  const weekEnd = new Date(report.weekEnd);

  // Calculate daily hours for the chart
  const maxMinutes = Math.max(
    ...report.dailyBreakdown.map((d) => d.totalMinutes),
    1 // Prevent division by zero
  );

  // Calculate today's total
  const today = new Date().toISOString().split('T')[0];
  const todayEntry = report.dailyBreakdown.find(
    (d) => d.date.split('T')[0] === today
  );
  const todayMinutes = todayEntry?.totalMinutes ?? 0;

  // Calculate average (excluding days with 0)
  const activeDays = report.dailyBreakdown.filter((d) => d.totalMinutes > 0);
  const averageMinutes = activeDays.length > 0
    ? Math.round(report.totalMinutes / activeDays.length)
    : 0;

  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${weekStart.toLocaleDateString('en-US', options)} - ${weekEnd.toLocaleDateString('en-US', options)}`;
  };

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Today:</span>
          <span className="font-mono text-sm font-medium tabular-nums">
            {formatMinutes(todayMinutes)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">This week:</span>
          <span className="font-mono text-sm font-medium tabular-nums">
            {formatMinutes(report.totalMinutes)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border border-border bg-background p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-foreground">Weekly Summary</h3>
        <span className="text-sm text-muted-foreground">{formatDateRange()}</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Today</span>
          </div>
          <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
            {formatMinutes(todayMinutes)}
          </span>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">Week</span>
          </div>
          <span className="font-mono text-lg font-semibold tabular-nums text-primary">
            {formatMinutes(report.totalMinutes)}
          </span>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Avg/day</span>
          </div>
          <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
            {formatMinutes(averageMinutes)}
          </span>
        </div>
      </div>

      {/* Daily Chart */}
      <div className="flex items-end justify-between gap-1 h-20">
        {report.dailyBreakdown.map((day) => {
          const date = new Date(day.date);
          const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
          const isToday = day.date.split('T')[0] === today;
          const heightPercent = maxMinutes > 0 ? (day.totalMinutes / maxMinutes) * 100 : 0;

          return (
            <div
              key={day.date}
              className="flex flex-col items-center flex-1"
              title={`${dayOfWeek}: ${formatMinutes(day.totalMinutes)}`}
            >
              <div className="w-full h-16 flex items-end justify-center">
                <div
                  className={cn(
                    'w-full max-w-8 rounded-t transition-all',
                    isToday ? 'bg-primary' : 'bg-muted-foreground/30',
                    day.totalMinutes === 0 && 'min-h-[2px]'
                  )}
                  style={{ height: `${Math.max(heightPercent, 2)}%` }}
                />
              </div>
              <span
                className={cn(
                  'text-xs mt-1',
                  isToday ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                {dayOfWeek}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
