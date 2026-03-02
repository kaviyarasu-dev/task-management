import { Router } from 'express';
import { apiKeyController } from '@modules/apiKey/apiKey.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';

const router = Router();

// All API key management routes require JWT auth and admin/owner role
router.use(authMiddleware);
router.use(requireRole(['admin', 'owner']));

// List all API keys for current tenant
router.get('/', asyncWrapper(apiKeyController.list));

// Create a new API key
router.post('/', asyncWrapper(apiKeyController.create));

// Get a single API key by ID
router.get('/:id', asyncWrapper(apiKeyController.getById));

// Update an API key's metadata
router.patch('/:id', asyncWrapper(apiKeyController.update));

// Revoke (deactivate) an API key
router.post('/:id/revoke', asyncWrapper(apiKeyController.revoke));

// Regenerate an API key's secret
router.post('/:id/regenerate', asyncWrapper(apiKeyController.regenerate));

// Delete an API key permanently
router.delete('/:id', asyncWrapper(apiKeyController.delete));

export { router as apiKeyRouter };
