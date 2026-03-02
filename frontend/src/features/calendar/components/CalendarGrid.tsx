import { useMemo } from 'react';
import type { Task } from '@/shared/types/entities.types';
import { CalendarDay } from './CalendarDay';
import {
  type CalendarView,
  getWeekdayNames,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameDay,
  startOfDay,
} from '../types/calendar.types';

interface CalendarGridProps {
  currentDate: Date;
  view: CalendarView;
  tasks: Task[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onTaskClick: (task: Task) => void;
}

export function CalendarGrid({
  currentDate,
  view,
  tasks,
  selectedDate,
  onSelectDate,
  onTaskClick,
}: CalendarGridProps) {
  const weekdayNames = getWeekdayNames('short');

  // Generate calendar days based on view
  const calendarDays = useMemo(() => {
    if (view === 'week') {
      return generateWeekDays(currentDate);
    }
    return generateMonthDays(currentDate);
  }, [currentDate, view]);

  // Group tasks by day
  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();

    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const dateKey = startOfDay(new Date(task.dueDate)).toISOString();
      const existing = map.get(dateKey) ?? [];
      map.set(dateKey, [...existing, task]);
    });

    return map;
  }, [tasks]);

  // Get tasks for a specific date
  const getTasksForDate = (date: Date): Task[] => {
    const dateKey = startOfDay(date).toISOString();
    return tasksByDay.get(dateKey) ?? [];
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/50">
        {weekdayNames.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid flex-1 grid-cols-7 auto-rows-fr">
        {calendarDays.map((day, index) => (
          <CalendarDay
            key={index}
            date={day.date}
            tasks={getTasksForDate(day.date)}
            isCurrentMonth={day.isCurrentMonth}
            isSelected={selectedDate ? isSameDay(day.date, selectedDate) : false}
            onSelectDate={onSelectDate}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </div>
  );
}

interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
}

function generateMonthDays(currentDate: Date): DayInfo[] {
  const days: DayInfo[] = [];
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const current = new Date(calendarStart);
  while (current <= calendarEnd) {
    days.push({
      date: new Date(current),
      isCurrentMonth:
        current.getMonth() === currentDate.getMonth() &&
        current.getFullYear() === currentDate.getFullYear(),
    });
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function generateWeekDays(currentDate: Date): DayInfo[] {
  const days: DayInfo[] = [];
  const weekStart = startOfWeek(currentDate);

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    days.push({
      date,
      isCurrentMonth: date.getMonth() === currentDate.getMonth(),
    });
  }

  return days;
}
