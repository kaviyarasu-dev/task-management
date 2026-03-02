import { Worker, Processor, Job } from 'bullmq';
import { getBullMQConnection } from '../../redis/client';

export type ReminderCheckJobData = {
  triggeredAt?: string;
};

export function createReminderWorker(processor: Processor<ReminderCheckJobData>): Worker<ReminderCheckJobData> {
  const worker = new Worker<ReminderCheckJobData>('reminders', processor, {
    connection: getBullMQConnection(),
    concurrency: 1, // Process one check at a time
  });

  worker.on('completed', (job: Job) => {
    console.log(`[ReminderWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`[ReminderWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err: Error) => {
    console.error('[ReminderWorker] Worker error:', err);
  });

  return worker;
}
