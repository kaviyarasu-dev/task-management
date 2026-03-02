import { z } from 'zod';
import { WEBHOOK_EVENTS } from '../types/webhook.types';

const validEventValues = WEBHOOK_EVENTS.map((e) => e.value);

export const createWebhookSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  url: z
    .string()
    .min(1, 'URL is required')
    .url('Please enter a valid URL')
    .refine(
      (url) => url.startsWith('https://'),
      'URL must use HTTPS protocol for security'
    ),
  events: z
    .array(z.string())
    .min(1, 'At least one event must be selected')
    .refine(
      (events) => events.every((e) => validEventValues.includes(e)),
      'Invalid event type selected'
    ),
  secret: z
    .string()
    .max(256, 'Secret must be less than 256 characters')
    .optional(),
  headers: z
    .record(z.string(), z.string())
    .optional()
    .default({}),
  isActive: z.boolean().default(true),
});

export type CreateWebhookFormData = z.infer<typeof createWebhookSchema>;

export const updateWebhookSchema = createWebhookSchema.partial().extend({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  url: z
    .string()
    .url('Please enter a valid URL')
    .refine((url) => url.startsWith('https://'), 'URL must use HTTPS protocol for security')
    .optional(),
});

export type UpdateWebhookFormData = z.infer<typeof updateWebhookSchema>;
