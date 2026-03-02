import { z } from 'zod';

/** MongoDB ObjectId validation regex */
const objectIdRegex = /^[a-f\d]{24}$/i;

export const taskIdParamSchema = z.object({
  taskId: z.string().regex(objectIdRegex, 'Invalid task ID'),
});

export const projectIdParamSchema = z.object({
  projectId: z.string().regex(objectIdRegex, 'Invalid project ID'),
});

export const userIdParamSchema = z.object({
  userId: z.string().regex(objectIdRegex, 'Invalid user ID'),
});

export const activityQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});
