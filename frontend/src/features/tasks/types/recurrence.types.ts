/**
 * Recurrence pattern type for recurring tasks
 */
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'custom';

/**
 * Days of week (0 = Sunday, 6 = Saturday)
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Day of week display names
 */
export const DAY_OF_WEEK_NAMES: Record<DayOfWeek, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

/**
 * Short day of week display names
 */
export const DAY_OF_WEEK_SHORT_NAMES: Record<DayOfWeek, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

/**
 * Recurrence pattern configuration
 */
export interface RecurrencePattern {
  type: RecurrenceType;
  interval: number; // Every N days/weeks/months
  daysOfWeek?: DayOfWeek[]; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  endDate?: string; // ISO date string
  endAfterCount?: number; // Number of occurrences
}

/**
 * Full recurrence object returned from API
 */
export interface Recurrence {
  _id: string;
  taskTemplateId: string;
  pattern: RecurrencePattern;
  nextOccurrence: string;
  endDate?: string;
  endAfterCount?: number;
  occurrenceCount: number;
  isActive: boolean;
  createdBy: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Preset recurrence options for quick selection
 */
export interface RecurrencePreset {
  label: string;
  pattern: RecurrencePattern;
}

/**
 * Common recurrence presets
 */
export const RECURRENCE_PRESETS: RecurrencePreset[] = [
  {
    label: 'Daily',
    pattern: { type: 'daily', interval: 1 },
  },
  {
    label: 'Every weekday',
    pattern: { type: 'weekly', interval: 1, daysOfWeek: [1, 2, 3, 4, 5] },
  },
  {
    label: 'Weekly',
    pattern: { type: 'weekly', interval: 1 },
  },
  {
    label: 'Every 2 weeks',
    pattern: { type: 'weekly', interval: 2 },
  },
  {
    label: 'Monthly',
    pattern: { type: 'monthly', interval: 1 },
  },
];

/**
 * Recurrence end type
 */
export type RecurrenceEndType = 'never' | 'on_date' | 'after_count';
