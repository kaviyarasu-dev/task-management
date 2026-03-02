import { cn } from '@/shared/lib/utils';
import type { Task } from '@/shared/types/entities.types';
import { CalendarTask } from './CalendarTask';
import { isSameDay } from '../types/calendar.types';

interface CalendarDayProps {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
  isSelected: boolean;
  onSelectDate: (date: Date) => void;
  onTaskClick: (task: Task) => void;
}

const MAX_VISIBLE_TASKS = 3;

export function CalendarDay({
  date,
  tasks,
  isCurrentMonth,
  isSelected,
  onSelectDate,
  onTaskClick,
}: CalendarDayProps) {
  const isToday = isSameDay(date, new Date());
  const dayNumber = date.getDate();
  const hasMoreTasks = tasks.length > MAX_VISIBLE_TASKS;
  const visibleTasks = tasks.slice(0, MAX_VISIBLE_TASKS);

  return (
    <div
      className={cn(
        'flex min-h-[100px] flex-col border-b border-r border-border p-1',
        !isCurrentMonth && 'bg-muted/30',
        isSelected && 'bg-primary/5 ring-1 ring-inset ring-primary'
      )}
    >
      {/* Day Number */}
      <button
        onClick={() => onSelectDate(date)}
        className={cn(
          'mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors',
          isToday
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted',
          !isCurrentMonth && 'text-muted-foreground'
        )}
      >
        {dayNumber}
      </button>

      {/* Tasks */}
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        {visibleTasks.map((task) => (
          <CalendarTask
            key={task._id}
            task={task}
            onClick={() => onTaskClick(task)}
          />
        ))}
        {hasMoreTasks && (
          <button
            onClick={() => onSelectDate(date)}
            className="text-left text-xs text-muted-foreground hover:text-foreground"
          >
            +{tasks.length - MAX_VISIBLE_TASKS} more
          </button>
        )}
      </div>
    </div>
  );
}
