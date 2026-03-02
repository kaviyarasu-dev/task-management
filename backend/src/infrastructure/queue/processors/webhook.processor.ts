import crypto from 'crypto';
import { Job } from 'bullmq';
import { WebhookJobData } from '../queues';
import { WebhookRepository } from '@modules/webhook/webhook.repository';
import { WebhookDeliveryRepository } from '@modules/webhook/webhookDelivery.repository';
import { EventBus } from '@core/events/EventBus';

const MAX_CONSECUTIVE_FAILURES = 10;
const TIMEOUT_MS = 10000; // 10 second timeout

/**
 * Webhook processor — delivers webhook payloads to external URLs.
 * Handles HMAC signature generation, retries, and failure tracking.
 */
export async function webhookProcessor(job: Job<WebhookJobData>): Promise<void> {
  const { deliveryId, tenantId } = job.data;

  console.log(`[WebhookProcessor] Processing delivery ${deliveryId}`);

  const webhookRepo = new WebhookRepository();
  const deliveryRepo = new WebhookDeliveryRepository();

  // Get delivery record
  const delivery = await deliveryRepo.findByIdWithoutTenant(deliveryId);
  if (!delivery) {
    console.log(`[WebhookProcessor] Delivery ${deliveryId} not found, skipping`);
    return;
  }

  // Get webhook configuration
  const webhook = await webhookRepo.findById(tenantId, delivery.webhookId.toString());
  if (!webhook) {
    await deliveryRepo.markFailed(deliveryId, {
      error: 'Webhook not found',
    });
    console.log(`[WebhookProcessor] Webhook not found for delivery ${deliveryId}`);
    return;
  }

  // Skip if webhook is disabled
  if (!webhook.isActive) {
    await deliveryRepo.markFailed(deliveryId, {
      error: 'Webhook is disabled',
    });
    console.log(`[WebhookProcessor] Webhook is disabled for delivery ${deliveryId}`);
    return;
  }

  const startTime = Date.now();

  try {
    // Prepare payload
    const body = JSON.stringify({
      event: delivery.event,
      timestamp: new Date().toISOString(),
      data: delivery.payload,
    });

    // Generate HMAC-SHA256 signature
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(body)
      .digest('hex');

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': `sha256=${signature}`,
      'X-Webhook-Event': delivery.event,
      'X-Webhook-Delivery': delivery._id?.toString() ?? deliveryId,
      ...(webhook.headers ?? {}),
    };

    // Make HTTP request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;
      const responseBody = await response.text().catch(() => '');
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      if (response.ok) {
        // Success
        await deliveryRepo.markDelivered(deliveryId, {
          responseStatus: response.status,
          responseBody: responseBody.substring(0, 10000), // Limit stored response
          responseHeaders,
          duration,
        });

        // Reset webhook failure count
        await webhookRepo.resetFailureCount(webhook._id?.toString() ?? '');

        EventBus.emit('webhook.delivered', {
          webhookId: webhook._id?.toString() ?? '',
          deliveryId,
          tenantId,
        });

        console.log(`[WebhookProcessor] Delivery ${deliveryId} succeeded (${response.status}) in ${duration}ms`);
      } else {
        // HTTP error response
        throw new Error(`HTTP ${response.status}: ${responseBody.substring(0, 500)}`);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const currentAttempt = (job.attemptsMade ?? 0) + 1;
    const maxAttempts = job.opts?.attempts ?? 5;

    console.error(`[WebhookProcessor] Delivery ${deliveryId} failed (attempt ${currentAttempt}/${maxAttempts}):`, errorMessage);

    if (currentAttempt >= maxAttempts) {
      // Final failure
      await deliveryRepo.markFailed(deliveryId, {
        error: errorMessage,
        duration,
      });

      // Increment webhook failure count
      await webhookRepo.incrementFailureCount(webhook._id?.toString() ?? '');

      // Auto-disable after too many consecutive failures
      if ((webhook.failureCount + 1) >= MAX_CONSECUTIVE_FAILURES) {
        await webhookRepo.disableWebhook(webhook._id?.toString() ?? '');
        console.log(`[WebhookProcessor] Webhook ${webhook._id} auto-disabled after ${MAX_CONSECUTIVE_FAILURES} consecutive failures`);
      }

      EventBus.emit('webhook.failed', {
        webhookId: webhook._id?.toString() ?? '',
        deliveryId,
        tenantId,
        reason: errorMessage,
      });
    } else {
      // Will retry - mark as retrying
      const backoffDelay = 60000 * Math.pow(2, currentAttempt - 1); // 1m, 2m, 4m, 8m, 16m
      const nextRetryAt = new Date(Date.now() + backoffDelay);

      await deliveryRepo.markRetrying(deliveryId, {
        error: errorMessage,
        duration,
        nextRetryAt,
      });
    }

    // Re-throw to trigger BullMQ retry
    throw error;
  }
}
