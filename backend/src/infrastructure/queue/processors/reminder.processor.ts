import { Job } from 'bullmq';
import { ReminderService } from '@modules/reminder/reminder.service';

/**
 * Reminder processor — processes due reminders from the TaskReminder collection.
 * Runs on a schedule and finds all reminders that are due to be sent.
 */
export async function reminderProcessor(job: Job): Promise<void> {
  console.log(`[ReminderProcessor] Starting reminder check (job ${job.id})`);

  const reminderService = new ReminderService();
  const processedCount = await reminderService.processDueReminders();

  console.log(`[ReminderProcessor] Processed ${processedCount} due reminders`);
}
