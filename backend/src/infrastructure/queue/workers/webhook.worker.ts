import { Worker, Processor } from 'bullmq';
import { getBullMQConnection } from '../../redis/client';
import { WebhookJobData } from '../queues';

/**
 * Webhook worker — processes webhook delivery jobs.
 * Business logic is injected as a processor from the modules layer.
 *
 * Concurrency is set to 5 for parallel webhook deliveries
 * since order doesn't matter and we want fast delivery.
 */
export function createWebhookWorker(processor: Processor<WebhookJobData>): Worker<WebhookJobData> {
  const worker = new Worker<WebhookJobData>('webhooks', processor, {
    connection: getBullMQConnection(),
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    console.log(`[WebhookWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[WebhookWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[WebhookWorker] Worker error:', err);
  });

  return worker;
}
