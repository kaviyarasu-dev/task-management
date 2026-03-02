import { Request, Response } from 'express';
import { InvitationService } from './invitation.service';
import {
  createInvitationSchema,
  acceptInvitationSchema,
  verifyTokenSchema,
  invitationIdParamSchema,
} from '@api/validators/invitation.validator';

const invitationService = new InvitationService();

export const invitationController = {
  /**
   * POST /invitations
   * Create a new invitation. Requires admin/owner role.
   */
  async create(req: Request, res: Response): Promise<void> {
    const input = createInvitationSchema.parse(req.body);
    const invitation = await invitationService.create(input);
    res.status(201).json({ success: true, data: invitation });
  },

  /**
   * GET /invitations
   * List all invitations for the current tenant.
   */
  async list(_req: Request, res: Response): Promise<void> {
    const invitations = await invitationService.list();
    res.json({ success: true, data: invitations, total: invitations.length });
  },

  /**
   * GET /invitations/verify/:token
   * Verify an invitation token (public route).
   * Returns invitation validity and tenant/inviter details.
   */
  async verify(req: Request, res: Response): Promise<void> {
    const { token } = verifyTokenSchema.parse(req.params);
    const result = await invitationService.verify(token);
    res.json({ success: true, data: result });
  },

  /**
   * POST /invitations/accept
   * Accept an invitation and create user account (public route).
   */
  async accept(req: Request, res: Response): Promise<void> {
    const input = acceptInvitationSchema.parse(req.body);
    const { user, tenantSlug } = await invitationService.accept(input);
    res.status(201).json({
      success: true,
      data: {
        message: 'Account created successfully',
        email: user.email,
        tenantSlug,
      },
    });
  },

  /**
   * POST /invitations/:id/resend
   * Resend an invitation email. Requires admin/owner role.
   */
  async resend(req: Request, res: Response): Promise<void> {
    const { id } = invitationIdParamSchema.parse(req.params);
    const invitation = await invitationService.resend(id);
    res.json({ success: true, data: invitation });
  },

  /**
   * DELETE /invitations/:id
   * Cancel a pending invitation. Requires admin/owner role.
   */
  async cancel(req: Request, res: Response): Promise<void> {
    const { id } = invitationIdParamSchema.parse(req.params);
    await invitationService.cancel(id);
    res.json({ success: true, message: 'Invitation cancelled' });
  },
};
