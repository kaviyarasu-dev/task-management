import { Request, Response } from 'express';
import { reportsService } from './reports.service';
import {
  metricsFilterSchema,
  velocityQuerySchema,
  dateRangeQuerySchema,
  burndownQuerySchema,
  productivityPeriodSchema,
} from '@api/validators/reports.validator';
import { VelocityPeriod } from './reports.types';

export const reportsController = {
  /**
   * GET /reports/tasks/metrics
   * Get comprehensive task metrics
   */
  async getTaskMetrics(req: Request, res: Response): Promise<void> {
    const filters = metricsFilterSchema.parse(req.query);
    const metrics = await reportsService.getTaskMetrics(filters);
    res.json({ success: true, data: metrics });
  },

  /**
   * GET /reports/tasks/velocity
   * Get task creation/completion velocity over time
   */
  async getVelocity(req: Request, res: Response): Promise<void> {
    const { period, start, end } = velocityQuerySchema.parse(req.query);
    const dateRange =
      start && end ? { start: new Date(start), end: new Date(end) } : undefined;

    const report = await reportsService.getVelocityReport(
      period as VelocityPeriod,
      dateRange
    );
    res.json({ success: true, data: report });
  },

  /**
   * GET /reports/tasks/completion-time
   * Get average task completion time
   */
  async getCompletionTime(req: Request, res: Response): Promise<void> {
    const filters = metricsFilterSchema.parse(req.query);
    const avgHours = await reportsService.getAverageCompletionTime(filters);
    res.json({
      success: true,
      data: {
        averageCompletionTimeHours: avgHours,
      },
    });
  },

  /**
   * GET /reports/users/productivity
   * Get productivity metrics per user (admin/owner only)
   */
  async getUserProductivity(req: Request, res: Response): Promise<void> {
    const { start, end } = dateRangeQuerySchema.parse(req.query);
    const dateRange =
      start && end ? { start: new Date(start), end: new Date(end) } : undefined;

    const report = await reportsService.getUserProductivity(dateRange);
    res.json({ success: true, data: report });
  },

  /**
   * GET /reports/projects/summary
   * Get summary metrics per project
   */
  async getProjectSummaries(_req: Request, res: Response): Promise<void> {
    const summaries = await reportsService.getProjectSummaries();
    res.json({ success: true, data: summaries });
  },

  /**
   * POST /reports/cache/invalidate
   * Force invalidate report caches
   */
  async invalidateCache(_req: Request, res: Response): Promise<void> {
    await reportsService.invalidateCache();
    res.json({ success: true, message: 'Report caches invalidated' });
  },

  /**
   * GET /reports/team/workload
   * Get workload distribution across team members (admin/owner only)
   */
  async getTeamWorkload(_req: Request, res: Response): Promise<void> {
    const workload = await reportsService.getTeamWorkload();
    res.json({ success: true, data: workload });
  },

  /**
   * GET /reports/team/productivity
   * Get team productivity ranking (admin/owner only)
   */
  async getTeamProductivityRanking(req: Request, res: Response): Promise<void> {
    const { period } = productivityPeriodSchema.parse(req.query);

    let dateRange: { start: Date; end: Date } | undefined;
    if (period !== 'all') {
      const end = new Date();
      const start = new Date();

      switch (period) {
        case 'week':
          start.setDate(start.getDate() - 7);
          break;
        case 'month':
          start.setMonth(start.getMonth() - 1);
          break;
        case 'quarter':
          start.setMonth(start.getMonth() - 3);
          break;
      }

      dateRange = { start, end };
    }

    const ranking = await reportsService.getUserProductivity(dateRange);
    res.json({ success: true, data: ranking });
  },

  /**
   * GET /reports/project/:id/health
   * Get health metrics for a specific project
   */
  async getProjectHealth(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const health = await reportsService.getProjectHealth(id);
    res.json({ success: true, data: health });
  },

  /**
   * GET /reports/project/:id/burndown
   * Get burndown chart data for a project
   */
  async getBurndown(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { start, end } = burndownQuerySchema.parse(req.query);
    const burndown = await reportsService.getBurndown(
      id,
      new Date(start),
      new Date(end)
    );
    res.json({ success: true, data: burndown });
  },
};
