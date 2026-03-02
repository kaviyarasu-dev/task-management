import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  defaultReminders: z
    .array(z.number().min(1).max(10080)) // Max 1 week in minutes
    .max(10)
    .optional(),
  overdueReminders: z.boolean().optional(),
  dailyDigest: z.boolean().optional(),
  digestTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
    .optional(),
  timezone: z.string().max(100).optional(),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
