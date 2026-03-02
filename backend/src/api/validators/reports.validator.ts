import { z } from 'zod';

/** MongoDB ObjectId validation regex */
const objectIdRegex = /^[a-f\d]{24}$/i;

/** ISO date string validation */
const isoDateString = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Invalid date format' }
);

/**
 * Metrics filter schema for task metrics endpoints
 */
export const metricsFilterSchema = z.object({
  projectId: z.string().regex(objectIdRegex, 'Invalid project ID').optional(),
  assigneeId: z.string().optional(),
  startDate: isoDateString.optional().transform((v) => v ? new Date(v) : undefined),
  endDate: isoDateString.optional().transform((v) => v ? new Date(v) : undefined),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  { message: 'startDate must be before or equal to endDate' }
);

/**
 * Velocity report query schema
 */
export const velocityQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  start: isoDateString.optional(),
  end: isoDateString.optional(),
}).refine(
  (data) => {
    if (data.start && data.end) {
      return new Date(data.start) <= new Date(data.end);
    }
    return true;
  },
  { message: 'start must be before or equal to end' }
);

/**
 * Date range query schema for productivity endpoints
 */
export const dateRangeQuerySchema = z.object({
  start: isoDateString.optional(),
  end: isoDateString.optional(),
}).refine(
  (data) => {
    if (data.start && data.end) {
      return new Date(data.start) <= new Date(data.end);
    }
    return true;
  },
  { message: 'start must be before or equal to end' }
);

/**
 * Burndown chart query schema - requires start and end dates
 */
export const burndownQuerySchema = z.object({
  start: isoDateString,
  end: isoDateString,
}).refine(
  (data) => new Date(data.start) <= new Date(data.end),
  { message: 'start must be before or equal to end' }
);

/**
 * Team productivity period query schema
 */
export const productivityPeriodSchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'all']).default('all'),
});

export type MetricsFilterInput = z.infer<typeof metricsFilterSchema>;
export type VelocityQueryInput = z.infer<typeof velocityQuerySchema>;
export type DateRangeQueryInput = z.infer<typeof dateRangeQuerySchema>;
export type BurndownQueryInput = z.infer<typeof burndownQuerySchema>;
export type ProductivityPeriodInput = z.infer<typeof productivityPeriodSchema>;
