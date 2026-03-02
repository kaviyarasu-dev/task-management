import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { exportController } from '@modules/reports/export.controller';

const router = Router();

// All export routes require authentication
router.use(authMiddleware);

// ============================================
// Export endpoints (download files)
// ============================================

// Task metrics export - available to all authenticated users
router.get('/task-metrics', asyncWrapper(exportController.exportTaskMetrics));

// Project summary export - available to all authenticated users
router.get('/project-summary', asyncWrapper(exportController.exportProjectSummary));

// Velocity export - available to all authenticated users
router.get('/velocity', asyncWrapper(exportController.exportVelocity));

// User productivity export - admin/owner only
router.get(
  '/user-productivity',
  requireRole(['admin', 'owner']),
  asyncWrapper(exportController.exportUserProductivity)
);

// Team workload export - admin/owner only
router.get(
  '/team-workload',
  requireRole(['admin', 'owner']),
  asyncWrapper(exportController.exportTeamWorkload)
);

// ============================================
// Scheduled reports CRUD (admin/owner only)
// ============================================

router.get(
  '/scheduled',
  requireRole(['admin', 'owner']),
  asyncWrapper(exportController.listScheduledReports)
);

router.get(
  '/scheduled/:id',
  requireRole(['admin', 'owner']),
  asyncWrapper(exportController.getScheduledReport)
);

router.post(
  '/scheduled',
  requireRole(['admin', 'owner']),
  asyncWrapper(exportController.createScheduledReport)
);

router.patch(
  '/scheduled/:id',
  requireRole(['admin', 'owner']),
  asyncWrapper(exportController.updateScheduledReport)
);

router.delete(
  '/scheduled/:id',
  requireRole(['admin', 'owner']),
  asyncWrapper(exportController.deleteScheduledReport)
);

export { router as exportRouter };
