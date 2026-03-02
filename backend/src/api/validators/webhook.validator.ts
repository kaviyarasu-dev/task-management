import { z } from 'zod';

/** MongoDB ObjectId validation regex */
const objectIdRegex = /^[a-f\d]{24}$/i;

/** Available webhook events */
const webhookEvents = [
  'task.created',
  'task.updated',
  'task.deleted',
  'task.completed',
  'task.assigned',
  'project.created',
  'project.updated',
  'project.deleted',
  'comment.created',
  'user.invited',
  'invitation.accepted',
] as const;

export const webhookIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid webhook ID'),
});

export const deliveryIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid webhook ID'),
  deliveryId: z.string().regex(objectIdRegex, 'Invalid delivery ID'),
});

export const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url('Invalid URL format'),
  events: z.array(z.enum(webhookEvents)).min(1, 'At least one event is required'),
  headers: z.record(z.string()).optional(),
});

export const updateWebhookSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url('Invalid URL format').optional(),
  events: z.array(z.enum(webhookEvents)).min(1).optional(),
  headers: z.record(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const webhookQuerySchema = z.object({
  isActive: z.enum(['true', 'false']).optional().transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  event: z.enum(webhookEvents).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export const deliveryQuerySchema = z.object({
  status: z.enum(['pending', 'delivered', 'failed', 'retrying']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});
