import { z } from 'zod';

/**
 * Schema for creating a new comment
 */
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(5000, 'Comment cannot exceed 5000 characters'),
  parentId: z.string().optional(),
});

/**
 * Schema for updating a comment
 */
export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(5000, 'Comment cannot exceed 5000 characters'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
