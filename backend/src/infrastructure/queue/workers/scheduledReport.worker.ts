import { Worker, Processor, Job } from 'bullmq';
import { getBullMQConnection } from '../../redis/client';
import { ScheduledReportJobData } from '../queues';

export function createScheduledReportWorker(
  processor: Processor<ScheduledReportJobData>
): Worker<ScheduledReportJobData> {
  const worker = new Worker<ScheduledReportJobData>('scheduled-reports', processor, {
    connection: getBullMQConnection(),
    concurrency: 1, // Process one check at a time
  });

  worker.on('completed', (job: Job) => {
    console.log(`[ScheduledReportWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`[ScheduledReportWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err: Error) => {
    console.error('[ScheduledReportWorker] Worker error:', err);
  });

  return worker;
}
