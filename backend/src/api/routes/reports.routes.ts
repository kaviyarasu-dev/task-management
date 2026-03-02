import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { reportsController } from '@modules/reports/reports.controller';

const router = Router();

// All reports routes require authentication
router.use(authMiddleware);

// Task metrics - available to all authenticated users
router.get('/tasks/metrics', asyncWrapper(reportsController.getTaskMetrics));
router.get('/tasks/velocity', asyncWrapper(reportsController.getVelocity));
router.get('/tasks/completion-time', asyncWrapper(reportsController.getCompletionTime));

// Project summaries - available to all authenticated users
router.get('/projects/summary', asyncWrapper(reportsController.getProjectSummaries));

// User productivity - admin/owner only
router.get(
  '/users/productivity',
  requireRole(['admin', 'owner']),
  asyncWrapper(reportsController.getUserProductivity)
);

// Cache invalidation - admin/owner only
router.post(
  '/cache/invalidate',
  requireRole(['admin', 'owner']),
  asyncWrapper(reportsController.invalidateCache)
);

// Team analytics - admin/owner only
router.get(
  '/team/workload',
  requireRole(['admin', 'owner']),
  asyncWrapper(reportsController.getTeamWorkload)
);
router.get(
  '/team/productivity',
  requireRole(['admin', 'owner']),
  asyncWrapper(reportsController.getTeamProductivityRanking)
);

// Project analytics - available to all authenticated users
router.get('/project/:id/health', asyncWrapper(reportsController.getProjectHealth));
router.get('/project/:id/burndown', asyncWrapper(reportsController.getBurndown));

export { router as reportsRouter };
