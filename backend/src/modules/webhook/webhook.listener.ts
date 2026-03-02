import { EventBus, EventPayloads, EventName } from '@core/events/EventBus';
import { WebhookService, WEBHOOK_EVENTS } from './webhook.service';

/**
 * Webhook listener — subscribes to domain events and queues webhook deliveries.
 * This bridges internal domain events to external integrations.
 *
 * No direct import from other modules — just EventBus events.
 */
export function registerWebhookListeners(): void {
  const webhookService = new WebhookService();

  // Subscribe to each webhook-eligible event
  for (const eventName of WEBHOOK_EVENTS) {
    EventBus.on(eventName as EventName, async (payload: EventPayloads[EventName]) => {
      const tenantId = (payload as { tenantId?: string }).tenantId;
      if (!tenantId) return;

      try {
        await webhookService.queueDelivery(eventName, payload as Record<string, unknown>, tenantId);
      } catch (error) {
        console.error(`[WebhookListener] Error queueing webhook for ${eventName}:`, error);
      }
    });
  }

  console.log('✅ Webhook listeners registered');
}
