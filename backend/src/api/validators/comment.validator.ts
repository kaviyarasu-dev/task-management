import { z } from 'zod';

/** MongoDB ObjectId validation regex */
const objectIdRegex = /^[a-f\d]{24}$/i;

export const commentIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid comment ID'),
});

export const taskIdParamSchema = z.object({
  taskId: z.string().regex(objectIdRegex, 'Invalid task ID'),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  parentId: z.string().regex(objectIdRegex, 'Invalid parent comment ID').optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
});

export const commentQuerySchema = z.object({
  parentId: z
    .string()
    .refine(
      (val) => val === 'null' || objectIdRegex.test(val),
      'Invalid parent ID (use "null" for top-level comments)'
    )
    .optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});
