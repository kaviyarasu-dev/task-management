import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { recurrenceController } from '@modules/recurrence/recurrence.controller';

const router = Router();

router.use(authMiddleware); // All recurrence routes require auth

// List recurrences (with optional filters)
router.get('/', asyncWrapper(recurrenceController.list));

// Get recurrence by ID
router.get('/:id', asyncWrapper(recurrenceController.getById));

// Get recurrence by task ID
router.get('/task/:taskId', asyncWrapper(recurrenceController.getByTaskId));

// Create recurrence for a task
router.post('/', asyncWrapper(recurrenceController.create));

// Update recurrence
router.patch('/:id', asyncWrapper(recurrenceController.update));

// Deactivate recurrence (soft pause)
router.post('/:id/deactivate', asyncWrapper(recurrenceController.deactivate));

// Delete recurrence
router.delete('/:id', asyncWrapper(recurrenceController.delete));

export { router as recurrenceRouter };
