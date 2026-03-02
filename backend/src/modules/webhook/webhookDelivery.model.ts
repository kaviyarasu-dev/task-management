import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';

export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying';

export interface IWebhookDelivery extends BaseDocument {
  webhookId: Types.ObjectId;
  event: string;
  payload: Record<string, unknown>;
  responseStatus?: number;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  deliveredAt?: Date;
  duration?: number; // Response time in ms
  status: DeliveryStatus;
  error?: string;
}

const webhookDeliverySchema = new Schema<IWebhookDelivery>({
  webhookId: {
    type: Schema.Types.ObjectId,
    ref: 'Webhook',
    required: true,
  },
  event: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  responseStatus: { type: Number },
  responseBody: { type: String },
  responseHeaders: { type: Schema.Types.Mixed },
  attemptCount: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  nextRetryAt: { type: Date },
  deliveredAt: { type: Date },
  duration: { type: Number },
  status: {
    type: String,
    enum: ['pending', 'delivered', 'failed', 'retrying'],
    default: 'pending',
  },
  error: { type: String },
});

applyBaseSchema(webhookDeliverySchema);

// Indexes for common query patterns
webhookDeliverySchema.index({ webhookId: 1, createdAt: -1 }); // Delivery history for a webhook
webhookDeliverySchema.index({ status: 1, nextRetryAt: 1 }); // Find deliveries to retry
webhookDeliverySchema.index({ tenantId: 1, createdAt: -1 }); // Tenant delivery history

export const WebhookDelivery = model<IWebhookDelivery>('WebhookDelivery', webhookDeliverySchema);
