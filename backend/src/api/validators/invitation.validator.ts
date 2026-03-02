import { z } from 'zod';

/** MongoDB ObjectId validation regex */
const objectIdRegex = /^[a-f\d]{24}$/i;

/** UUID v4 validation regex */
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member', 'viewer']).optional().default('member'),
});

export const acceptInvitationSchema = z.object({
  token: z.string().regex(uuidRegex, 'Invalid invitation token'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

export const verifyTokenSchema = z.object({
  token: z.string().regex(uuidRegex, 'Invalid invitation token'),
});

export const invitationIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid invitation ID'),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
