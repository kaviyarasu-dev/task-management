import { z } from 'zod';

export const startTimerSchema = z.object({
  taskId: z.string().min(1, 'Task is required'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

export type StartTimerFormData = z.infer<typeof startTimerSchema>;

export const createTimeEntrySchema = z.object({
  taskId: z.string().min(1, 'Task is required'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  startedAt: z.string().min(1, 'Start time is required'),
  endedAt: z.string().min(1, 'End time is required'),
  durationMinutes: z.number().min(0).optional(),
  billable: z.boolean().default(false),
}).refine(
  (data) => new Date(data.endedAt) > new Date(data.startedAt),
  { message: 'End time must be after start time', path: ['endedAt'] }
);

export type CreateTimeEntryFormData = z.infer<typeof createTimeEntrySchema>;

export const updateTimeEntrySchema = z.object({
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  durationMinutes: z.number().min(0).optional(),
  billable: z.boolean().optional(),
});

export type UpdateTimeEntryFormData = z.infer<typeof updateTimeEntrySchema>;

export const manualTimeEntrySchema = z.object({
  taskId: z.string().min(1, 'Task is required'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  date: z.string().min(1, 'Date is required'),
  hours: z.number().min(0, 'Hours must be 0 or more').max(24, 'Hours cannot exceed 24'),
  minutes: z.number().min(0, 'Minutes must be 0 or more').max(59, 'Minutes cannot exceed 59'),
  billable: z.boolean().default(false),
}).refine(
  (data) => data.hours > 0 || data.minutes > 0,
  { message: 'Duration must be greater than 0', path: ['hours'] }
);

export type ManualTimeEntryFormData = z.infer<typeof manualTimeEntrySchema>;
