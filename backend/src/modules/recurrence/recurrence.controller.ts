import { Request, Response } from 'express';
import { RecurrenceService } from './recurrence.service';
import {
  createRecurrenceSchema,
  updateRecurrenceSchema,
  recurrenceQuerySchema,
  recurrenceIdParamSchema,
  taskIdParamSchema,
} from '@api/validators/recurrence.validator';

const recurrenceService = new RecurrenceService();

export const recurrenceController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = recurrenceQuerySchema.parse(req.query);
    const { taskId, isActive, cursor, limit } = query;
    const result = await recurrenceService.list(
      { taskTemplateId: taskId, isActive },
      { cursor, limit }
    );
    res.json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = recurrenceIdParamSchema.parse(req.params);
    const recurrence = await recurrenceService.getById(id);
    res.json({ success: true, data: recurrence });
  },

  async getByTaskId(req: Request, res: Response): Promise<void> {
    const { taskId } = taskIdParamSchema.parse(req.params);
    const recurrence = await recurrenceService.getByTaskId(taskId);
    res.json({ success: true, data: recurrence });
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = createRecurrenceSchema.parse(req.body);
    const recurrence = await recurrenceService.create(input.taskId, input.pattern, {
      endDate: input.endDate,
      endAfterCount: input.endAfterCount,
    });
    res.status(201).json({ success: true, data: recurrence });
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = recurrenceIdParamSchema.parse(req.params);
    const input = updateRecurrenceSchema.parse(req.body);
    const recurrence = await recurrenceService.update(id, {
      pattern: input.pattern,
      endDate: input.endDate ?? undefined,
      endAfterCount: input.endAfterCount ?? undefined,
      isActive: input.isActive,
    });
    res.json({ success: true, data: recurrence });
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = recurrenceIdParamSchema.parse(req.params);
    await recurrenceService.delete(id);
    res.json({ success: true, message: 'Recurrence deleted' });
  },

  async deactivate(req: Request, res: Response): Promise<void> {
    const { id } = recurrenceIdParamSchema.parse(req.params);
    await recurrenceService.deactivate(id);
    res.json({ success: true, message: 'Recurrence deactivated' });
  },
};
