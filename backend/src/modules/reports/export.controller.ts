import { Request, Response } from 'express';
import { reportsService } from './reports.service';
import { ScheduledReportService } from './scheduledReport.service';
import {
  exportQuerySchema,
  scheduledReportCreateSchema,
  scheduledReportUpdateSchema,
  scheduledReportIdSchema,
} from '@api/validators/export.validator';
import {
  exportTaskMetricsCSV,
  exportUserProductivityCSV,
  exportTeamWorkloadCSV,
  exportProjectSummaryCSV,
  exportVelocityCSV,
} from './export/csv.exporter';
import { exportToJSON } from './export/json.exporter';
import type { VelocityPeriod } from './reports.types';

const scheduledReportService = new ScheduledReportService();

export const exportController = {
  // ============================================
  // Export endpoints (download files)
  // ============================================

  /**
   * GET /export/task-metrics
   * Export task metrics as CSV or JSON
   */
  async exportTaskMetrics(req: Request, res: Response): Promise<void> {
    const { format, projectId, start, end } = exportQuerySchema.parse(req.query);

    const filters = {
      projectId,
      startDate: start ? new Date(start) : undefined,
      endDate: end ? new Date(end) : undefined,
    };

    const data = await reportsService.getTaskMetrics(filters);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="task-metrics.json"');
      res.send(exportToJSON(data, undefined, { prettyPrint: true }));
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="task-metrics.csv"');
      res.send(exportTaskMetricsCSV(data));
    }
  },

  /**
   * GET /export/user-productivity
   * Export user productivity as CSV or JSON (admin/owner only)
   */
  async exportUserProductivity(req: Request, res: Response): Promise<void> {
    const { format, start, end } = exportQuerySchema.parse(req.query);

    const dateRange =
      start && end ? { start: new Date(start), end: new Date(end) } : undefined;

    const data = await reportsService.getUserProductivity(dateRange);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="user-productivity.json"');
      res.send(exportToJSON(data, undefined, { prettyPrint: true }));
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="user-productivity.csv"');
      res.send(exportUserProductivityCSV(data));
    }
  },

  /**
   * GET /export/team-workload
   * Export team workload as CSV or JSON (admin/owner only)
   */
  async exportTeamWorkload(req: Request, res: Response): Promise<void> {
    const { format } = exportQuerySchema.parse(req.query);

    const data = await reportsService.getTeamWorkload();

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="team-workload.json"');
      res.send(exportToJSON(data, undefined, { prettyPrint: true }));
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="team-workload.csv"');
      res.send(exportTeamWorkloadCSV(data));
    }
  },

  /**
   * GET /export/project-summary
   * Export project summary as CSV or JSON
   */
  async exportProjectSummary(req: Request, res: Response): Promise<void> {
    const { format } = exportQuerySchema.parse(req.query);

    const data = await reportsService.getProjectSummaries();

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="project-summary.json"');
      res.send(exportToJSON(data, undefined, { prettyPrint: true }));
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="project-summary.csv"');
      res.send(exportProjectSummaryCSV(data));
    }
  },

  /**
   * GET /export/velocity
   * Export velocity report as CSV or JSON
   */
  async exportVelocity(req: Request, res: Response): Promise<void> {
    const { format, start, end } = exportQuerySchema.parse(req.query);

    const dateRange =
      start && end ? { start: new Date(start), end: new Date(end) } : undefined;

    const data = await reportsService.getVelocityReport('weekly' as VelocityPeriod, dateRange);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="velocity.json"');
      res.send(exportToJSON(data, undefined, { prettyPrint: true }));
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="velocity.csv"');
      res.send(exportVelocityCSV(data));
    }
  },

  // ============================================
  // Scheduled report CRUD (admin/owner only)
  // ============================================

  /**
   * GET /export/scheduled
   * List all scheduled reports for the tenant
   */
  async listScheduledReports(_req: Request, res: Response): Promise<void> {
    const reports = await scheduledReportService.list();
    res.json({ success: true, data: reports });
  },

  /**
   * GET /export/scheduled/:id
   * Get a specific scheduled report
   */
  async getScheduledReport(req: Request, res: Response): Promise<void> {
    const { id } = scheduledReportIdSchema.parse(req.params);
    const report = await scheduledReportService.getById(id);
    res.json({ success: true, data: report });
  },

  /**
   * POST /export/scheduled
   * Create a new scheduled report
   */
  async createScheduledReport(req: Request, res: Response): Promise<void> {
    const data = scheduledReportCreateSchema.parse(req.body);
    const report = await scheduledReportService.create(data);
    res.status(201).json({ success: true, data: report });
  },

  /**
   * PATCH /export/scheduled/:id
   * Update a scheduled report
   */
  async updateScheduledReport(req: Request, res: Response): Promise<void> {
    const { id } = scheduledReportIdSchema.parse(req.params);
    const data = scheduledReportUpdateSchema.parse(req.body);
    const report = await scheduledReportService.update(id, data);
    res.json({ success: true, data: report });
  },

  /**
   * DELETE /export/scheduled/:id
   * Delete a scheduled report
   */
  async deleteScheduledReport(req: Request, res: Response): Promise<void> {
    const { id } = scheduledReportIdSchema.parse(req.params);
    await scheduledReportService.delete(id);
    res.json({ success: true, message: 'Scheduled report deleted' });
  },
};
