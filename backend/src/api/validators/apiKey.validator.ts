import { z } from 'zod';

/** MongoDB ObjectId validation regex */
const objectIdRegex = /^[a-f\d]{24}$/i;

const permissions = [
  'tasks:read',
  'tasks:write',
  'projects:read',
  'projects:write',
  'users:read',
  'reports:read',
] as const;

export const apiKeyIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid API key ID'),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  permissions: z
    .array(z.enum(permissions))
    .min(1, 'At least one permission is required')
    .max(permissions.length),
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  rateLimit: z
    .number()
    .int()
    .min(1, 'Rate limit must be at least 1')
    .max(1000, 'Rate limit cannot exceed 1000')
    .optional(),
});

export const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissions: z.array(z.enum(permissions)).min(1).max(permissions.length).optional(),
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .transform((v) => (v ? new Date(v) : undefined)),
  rateLimit: z.number().int().min(1).max(1000).optional(),
  isActive: z.boolean().optional(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>;
