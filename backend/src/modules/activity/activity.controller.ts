import { Request, Response } from 'express';
import { ActivityService } from './activity.service';
import {
  activityQuerySchema,
  taskIdParamSchema,
  projectIdParamSchema,
  userIdParamSchema,
} from '@api/validators/activity.validator';

const activityService = new ActivityService();

export const activityController = {
  async getRecent(req: Request, res: Response): Promise<void> {
    const query = activityQuerySchema.parse(req.query);
    const result = await activityService.getRecent(query);
    res.json({ success: true, ...result });
  },

  async getTaskActivity(req: Request, res: Response): Promise<void> {
    const { taskId } = taskIdParamSchema.parse(req.params);
    const query = activityQuerySchema.parse(req.query);
    const result = await activityService.getTaskActivity(taskId, query);
    res.json({ success: true, ...result });
  },

  async getProjectActivity(req: Request, res: Response): Promise<void> {
    const { projectId } = projectIdParamSchema.parse(req.params);
    const query = activityQuerySchema.parse(req.query);
    const result = await activityService.getProjectActivity(projectId, query);
    res.json({ success: true, ...result });
  },

  async getUserActivity(req: Request, res: Response): Promise<void> {
    const { userId } = userIdParamSchema.parse(req.params);
    const query = activityQuerySchema.parse(req.query);
    const result = await activityService.getUserActivity(userId, query);
    res.json({ success: true, ...result });
  },
};
