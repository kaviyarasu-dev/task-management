import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { activityController } from '@modules/activity/activity.controller';

const router = Router();

router.use(authMiddleware); // All activity routes require auth

// Recent activity feed
router.get('/', asyncWrapper(activityController.getRecent));

// Entity-specific activity
router.get('/tasks/:taskId', asyncWrapper(activityController.getTaskActivity));
router.get('/projects/:projectId', asyncWrapper(activityController.getProjectActivity));
router.get('/users/:userId', asyncWrapper(activityController.getUserActivity));

export { router as activityRouter };
