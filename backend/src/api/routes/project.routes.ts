import { Router } from 'express';
import { projectController } from '@modules/project/project.controller';
import { authMiddleware, requireRole, requireApiPermission } from '../middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';

const router = Router();

router.use(authMiddleware);

// Read operations require projects:read permission
router.get('/', requireApiPermission('projects:read'), asyncWrapper(projectController.list));
router.get('/:id', requireApiPermission('projects:read'), asyncWrapper(projectController.getById));

// Write operations require projects:write permission
router.post('/', requireApiPermission('projects:write'), asyncWrapper(projectController.create));
router.patch('/:id', requireApiPermission('projects:write'), asyncWrapper(projectController.update));
router.delete(
  '/:id',
  requireRole(['owner', 'admin']),
  requireApiPermission('projects:write'),
  asyncWrapper(projectController.delete)
);

export { router as projectRouter };
