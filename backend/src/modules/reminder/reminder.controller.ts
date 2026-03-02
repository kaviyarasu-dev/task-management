import { Request, Response } from 'express';
import { ReminderService } from './reminder.service';
import { updatePreferencesSchema } from '@api/validators/reminder.validator';

const reminderService = new ReminderService();

export const reminderController = {
  async getPreferences(_req: Request, res: Response): Promise<void> {
    const preferences = await reminderService.getMyPreferences();
    res.json({ success: true, data: preferences });
  },

  async updatePreferences(req: Request, res: Response): Promise<void> {
    const data = updatePreferencesSchema.parse(req.body);
    const preferences = await reminderService.updatePreferences(data);
    res.json({ success: true, data: preferences });
  },
};
