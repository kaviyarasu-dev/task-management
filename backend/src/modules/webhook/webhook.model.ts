import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';

export type WebhookDeliveryStatus = 'success' | 'failed';

export interface IWebhook extends BaseDocument {
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  lastDeliveryAt?: Date;
  lastDeliveryStatus?: WebhookDeliveryStatus;
  failureCount: number;
  headers?: Record<string, string>;
  createdBy: Types.ObjectId;
}

const webhookSchema = new Schema<IWebhook>({
  name: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  secret: { type: String, required: true },
  events: { type: [String], required: true },
  isActive: { type: Boolean, default: true },
  lastDeliveryAt: { type: Date },
  lastDeliveryStatus: {
    type: String,
    enum: ['success', 'failed'],
  },
  failureCount: { type: Number, default: 0 },
  headers: { type: Schema.Types.Mixed },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

applyBaseSchema(webhookSchema);

// Indexes for common query patterns
webhookSchema.index({ tenantId: 1, isActive: 1 }); // List active webhooks
webhookSchema.index({ tenantId: 1, events: 1 }); // Find webhooks by event type

export const Webhook = model<IWebhook>('Webhook', webhookSchema);
