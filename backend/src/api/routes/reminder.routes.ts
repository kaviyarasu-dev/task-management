import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { reminderController } from '@modules/reminder/reminder.controller';

const router = Router();

router.use(authMiddleware); // All reminder routes require auth

// Get current user's reminder preferences
router.get('/preferences', asyncWrapper(reminderController.getPreferences));

// Update current user's reminder preferences
router.patch('/preferences', asyncWrapper(reminderController.updatePreferences));

export { router as reminderRouter };
