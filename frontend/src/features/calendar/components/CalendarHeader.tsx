import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type CalendarView, formatMonthYear } from '../types/calendar.types';
import { cn } from '@/shared/lib/utils';

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
}

export function CalendarHeader({
  currentDate,
  view,
  onPrev,
  onNext,
  onToday,
  onViewChange,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToday}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          Today
        </button>
        <div className="flex items-center">
          <button
            onClick={onPrev}
            className="rounded-l-md border border-border bg-background p-1.5 hover:bg-muted"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={onNext}
            className="rounded-r-md border border-l-0 border-border bg-background p-1.5 hover:bg-muted"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <h2 className="ml-4 text-lg font-semibold text-foreground">
          {formatMonthYear(currentDate)}
        </h2>
      </div>

      {/* Right: View Toggle */}
      <div className="flex items-center rounded-md border border-border bg-background">
        <button
          onClick={() => onViewChange('month')}
          className={cn(
            'rounded-l-md px-3 py-1.5 text-sm font-medium transition-colors',
            view === 'month'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Month
        </button>
        <button
          onClick={() => onViewChange('week')}
          className={cn(
            'rounded-r-md border-l border-border px-3 py-1.5 text-sm font-medium transition-colors',
            view === 'week'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Week
        </button>
      </div>
    </div>
  );
}
