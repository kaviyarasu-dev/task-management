import { Worker, Processor, Job } from 'bullmq';
import { getBullMQConnection } from '../../redis/client';
import { DigestJobData } from '../queues';

export function createDigestWorker(processor: Processor<DigestJobData>): Worker<DigestJobData> {
  const worker = new Worker<DigestJobData>('digest', processor, {
    connection: getBullMQConnection(),
    concurrency: 1, // Process one digest job at a time
  });

  worker.on('completed', (job: Job) => {
    console.log(`[DigestWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`[DigestWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err: Error) => {
    console.error('[DigestWorker] Worker error:', err);
  });

  return worker;
}
