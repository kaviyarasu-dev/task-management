import { z } from 'zod';

/**
 * Day of week validation (0 = Sunday, 6 = Saturday)
 */
export const dayOfWeekSchema = z.number().int().min(0).max(6);

/**
 * Recurrence pattern schema
 */
export const recurrencePatternSchema = z
  .object({
    type: z.enum(['daily', 'weekly', 'monthly', 'custom']),
    interval: z
      .number()
      .int()
      .min(1, 'Interval must be at least 1')
      .max(365, 'Interval cannot exceed 365'),
    daysOfWeek: z.array(dayOfWeekSchema).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    endDate: z.string().optional(),
    endAfterCount: z.number().int().min(1).max(999).optional(),
  })
  .refine(
    (data) => {
      // Weekly type should have daysOfWeek when specified
      if (data.type === 'weekly' && data.daysOfWeek && data.daysOfWeek.length === 0) {
        return false;
      }
      return true;
    },
    {
      message: 'Weekly recurrence must have at least one day selected',
      path: ['daysOfWeek'],
    }
  )
  .refine(
    (data) => {
      // Cannot have both endDate and endAfterCount
      if (data.endDate && data.endAfterCount) {
        return false;
      }
      return true;
    },
    {
      message: 'Cannot specify both end date and occurrence count',
      path: ['endAfterCount'],
    }
  );

export type RecurrencePatternFormData = z.infer<typeof recurrencePatternSchema>;

/**
 * Full recurrence form schema (for create/update)
 */
export const recurrenceFormSchema = z.object({
  pattern: recurrencePatternSchema,
  endDate: z.string().optional(),
  endAfterCount: z.number().int().min(1).max(999).optional(),
});

export type RecurrenceFormData = z.infer<typeof recurrenceFormSchema>;
