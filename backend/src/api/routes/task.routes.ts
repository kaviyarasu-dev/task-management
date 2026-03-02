import { Router } from 'express';
import { authMiddleware, requireApiPermission } from '../middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { taskController } from '@modules/task/task.controller';

const router = Router();

router.use(authMiddleware); // All task routes require auth

// Read operations require tasks:read permission
router.get('/', requireApiPermission('tasks:read'), asyncWrapper(taskController.list));
router.get('/:id', requireApiPermission('tasks:read'), asyncWrapper(taskController.getById));
router.get('/:id/transitions', requireApiPermission('tasks:read'), asyncWrapper(taskController.getAvailableTransitions));

// Write operations require tasks:write permission
router.post('/', requireApiPermission('tasks:write'), asyncWrapper(taskController.create));
router.patch('/:id', requireApiPermission('tasks:write'), asyncWrapper(taskController.update));
router.delete('/:id', requireApiPermission('tasks:write'), asyncWrapper(taskController.delete));

export { router as taskRouter };
