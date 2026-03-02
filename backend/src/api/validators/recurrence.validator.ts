import { z } from 'zod';

/** MongoDB ObjectId validation regex */
const objectIdRegex = /^[a-f\d]{24}$/i;

export const recurrenceIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid recurrence ID'),
});

export const taskIdParamSchema = z.object({
  taskId: z.string().regex(objectIdRegex, 'Invalid task ID'),
});

export const recurrencePatternSchema = z
  .object({
    type: z.enum(['daily', 'weekly', 'monthly', 'custom']),
    interval: z.number().int().min(1).max(365),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    cronExpression: z.string().max(100).optional(),
  })
  .refine(
    (data) => {
      // Weekly recurrence should have daysOfWeek
      if (data.type === 'weekly' && data.daysOfWeek && data.daysOfWeek.length === 0) {
        return false;
      }
      return true;
    },
    { message: 'Weekly recurrence must specify at least one day of week' }
  )
  .refine(
    (data) => {
      // Custom recurrence should have cronExpression
      if (data.type === 'custom' && !data.cronExpression) {
        return false;
      }
      return true;
    },
    { message: 'Custom recurrence must specify a cron expression' }
  );

export const createRecurrenceSchema = z.object({
  taskId: z.string().regex(objectIdRegex, 'Invalid task ID'),
  pattern: recurrencePatternSchema,
  endDate: z
    .string()
    .datetime()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  endAfterCount: z.number().int().min(1).max(1000).optional(),
});

export const updateRecurrenceSchema = z.object({
  pattern: recurrencePatternSchema.optional(),
  endDate: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .transform((v) => (v ? new Date(v) : undefined)),
  endAfterCount: z.number().int().min(1).max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const recurrenceQuerySchema = z.object({
  taskId: z.string().regex(objectIdRegex, 'Invalid task ID').optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      return undefined;
    }),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});
