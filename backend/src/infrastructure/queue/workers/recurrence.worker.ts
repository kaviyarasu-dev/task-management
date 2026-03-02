import { Worker, Processor } from 'bullmq';
import { getBullMQConnection } from '../../redis/client';
import { RecurrenceJobData } from '../queues';

export function createRecurrenceWorker(
  processor: Processor<RecurrenceJobData>
): Worker<RecurrenceJobData> {
  const worker = new Worker<RecurrenceJobData>('recurrence', processor, {
    connection: getBullMQConnection(),
    concurrency: 1, // Process one check at a time to avoid race conditions
  });

  worker.on('completed', (job) => {
    console.log(`[RecurrenceWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[RecurrenceWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[RecurrenceWorker] Worker error:', err);
  });

  return worker;
}
