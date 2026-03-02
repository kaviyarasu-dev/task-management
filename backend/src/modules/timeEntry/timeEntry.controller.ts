import { Request, Response } from 'express';
import { TimeEntryService } from './timeEntry.service';
import {
  startTimerSchema,
  createManualEntrySchema,
  updateTimeEntrySchema,
  timeEntryQuerySchema,
  timeEntryIdParamSchema,
  taskIdParamSchema,
  userIdQuerySchema,
} from '@api/validators/timeEntry.validator';

const timeEntryService = new TimeEntryService();

export const timeEntryController = {
  // Timer endpoints
  async startTimer(req: Request, res: Response): Promise<void> {
    const input = startTimerSchema.parse(req.body);
    const entry = await timeEntryService.startTimer(input.taskId, input.description);
    res.status(201).json({ success: true, data: entry });
  },

  async stopTimer(req: Request, res: Response): Promise<void> {
    const { id } = timeEntryIdParamSchema.parse(req.params);
    const entry = await timeEntryService.stopTimer(id);
    res.json({ success: true, data: entry });
  },

  async getActiveTimer(_req: Request, res: Response): Promise<void> {
    const entry = await timeEntryService.getActiveTimer();
    res.json({ success: true, data: entry });
  },

  // CRUD endpoints
  async list(req: Request, res: Response): Promise<void> {
    const query = timeEntryQuerySchema.parse(req.query);
    const { taskId, userId, startedAfter, startedBefore, billable, cursor, limit } = query;
    const result = await timeEntryService.list(
      { taskId, userId, startedAfter, startedBefore, billable },
      { cursor, limit }
    );
    res.json({ success: true, ...result });
  },

  async listByTask(req: Request, res: Response): Promise<void> {
    const { taskId } = taskIdParamSchema.parse(req.params);
    const entries = await timeEntryService.listByTask(taskId);
    res.json({ success: true, data: entries });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = timeEntryIdParamSchema.parse(req.params);
    const entry = await timeEntryService.getById(id);
    res.json({ success: true, data: entry });
  },

  async createManual(req: Request, res: Response): Promise<void> {
    const input = createManualEntrySchema.parse(req.body);
    const entry = await timeEntryService.createManualEntry({
      taskId: input.taskId,
      description: input.description,
      startedAt: new Date(input.startedAt),
      endedAt: new Date(input.endedAt),
      durationMinutes: input.durationMinutes,
      billable: input.billable,
    });
    res.status(201).json({ success: true, data: entry });
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = timeEntryIdParamSchema.parse(req.params);
    const input = updateTimeEntrySchema.parse(req.body);
    const entry = await timeEntryService.update(id, input);
    res.json({ success: true, data: entry });
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = timeEntryIdParamSchema.parse(req.params);
    await timeEntryService.delete(id);
    res.json({ success: true, message: 'Time entry deleted' });
  },

  // Reports
  async getWeeklyReport(req: Request, res: Response): Promise<void> {
    const { userId } = userIdQuerySchema.parse(req.query);
    const report = await timeEntryService.getUserWeeklyReport(userId);
    res.json({ success: true, data: report });
  },

  async getTaskTotal(req: Request, res: Response): Promise<void> {
    const { taskId } = taskIdParamSchema.parse(req.params);
    const totalMinutes = await timeEntryService.getTaskTotal(taskId);
    res.json({ success: true, data: { taskId, totalMinutes } });
  },
};
