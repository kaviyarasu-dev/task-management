import { Request, Response } from 'express';
import { TaskService } from './task.service';
import { TransitionService } from '../status/transition.service';
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
  taskIdParamSchema,
} from '@api/validators/task.validator';

const taskService = new TaskService();
const transitionService = new TransitionService();

export const taskController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = taskQuerySchema.parse(req.query);
    const { projectId, assigneeId, status, priority, cursor, limit } = query;
    const result = await taskService.list(
      { projectId, assigneeId, status, priority },
      { cursor, limit }
    );
    res.json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = taskIdParamSchema.parse(req.params);
    const task = await taskService.getById(id);
    res.json({ success: true, data: task });
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = createTaskSchema.parse(req.body);
    const task = await taskService.create(input);
    res.status(201).json({ success: true, data: task });
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = taskIdParamSchema.parse(req.params);
    const input = updateTaskSchema.parse(req.body);
    const task = await taskService.update(id, input);
    res.json({ success: true, data: task });
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = taskIdParamSchema.parse(req.params);
    await taskService.delete(id);
    res.json({ success: true, message: 'Task deleted' });
  },

  async getAvailableTransitions(req: Request, res: Response): Promise<void> {
    const { id } = taskIdParamSchema.parse(req.params);
    const task = await taskService.getById(id);
    const statusId = task.status.toString();
    const transitions = await transitionService.getAvailableTransitions(statusId);
    res.json({ success: true, data: transitions });
  },
};
