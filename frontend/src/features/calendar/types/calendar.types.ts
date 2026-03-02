import type { Task } from '@/shared/types/entities.types';

export type CalendarView = 'month' | 'week';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export interface CalendarMonth {
  year: number;
  month: number;
  weeks: CalendarWeek[];
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Helper to check if two dates are the same day
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Get start of day
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get end of day
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// Get start of week (Sunday)
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return startOfDay(d);
}

// Get end of week (Saturday)
export function endOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  return endOfDay(d);
}

// Get start of month
export function startOfMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return startOfDay(d);
}

// Get end of month
export function endOfMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return endOfDay(d);
}

// Add months to date
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// Add weeks to date
export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

// Format month and year
export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

// Format day of week
export function formatDayOfWeek(date: Date, format: 'short' | 'long' = 'short'): string {
  return new Intl.DateTimeFormat('en-US', { weekday: format }).format(date);
}

// Get weekday names
export function getWeekdayNames(format: 'short' | 'long' = 'short'): string[] {
  const baseDate = new Date(2024, 0, 7); // A Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    return formatDayOfWeek(date, format);
  });
}
