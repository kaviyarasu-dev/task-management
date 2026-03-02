import { Router } from 'express';
import { invitationController } from '@modules/invitation/invitation.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';

const router = Router();

// ─── Public routes (no auth required) ────────────────────────────────────────
router.get('/verify/:token', asyncWrapper(invitationController.verify));
router.post('/accept', asyncWrapper(invitationController.accept));

// ─── Protected routes ────────────────────────────────────────────────────────
router.use(authMiddleware);

// Admin/owner only routes
router.post('/', requireRole(['owner', 'admin']), asyncWrapper(invitationController.create));
router.get('/', requireRole(['owner', 'admin']), asyncWrapper(invitationController.list));
router.post('/:id/resend', requireRole(['owner', 'admin']), asyncWrapper(invitationController.resend));
router.delete('/:id', requireRole(['owner', 'admin']), asyncWrapper(invitationController.cancel));

export { router as invitationRouter };
