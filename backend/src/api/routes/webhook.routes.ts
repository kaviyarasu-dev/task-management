import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { webhookController } from '@modules/webhook/webhook.controller';

const router = Router();

// All webhook routes require authentication
router.use(authMiddleware);

// All webhook management requires admin or owner role
router.use(requireRole(['admin', 'owner']));

// Get available webhook events
router.get('/events', asyncWrapper(webhookController.getAvailableEvents));

// Webhook CRUD
router.get('/', asyncWrapper(webhookController.list));
router.get('/:id', asyncWrapper(webhookController.getById));
router.post('/', asyncWrapper(webhookController.create));
router.patch('/:id', asyncWrapper(webhookController.update));
router.delete('/:id', asyncWrapper(webhookController.delete));

// Webhook actions
router.post('/:id/test', asyncWrapper(webhookController.test));
router.post('/:id/regenerate-secret', asyncWrapper(webhookController.regenerateSecret));

// Delivery history
router.get('/:id/deliveries', asyncWrapper(webhookController.getDeliveries));
router.post('/:id/deliveries/:deliveryId/retry', asyncWrapper(webhookController.retryDelivery));

export { router as webhookRouter };
