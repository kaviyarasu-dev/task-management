import { Types } from 'mongoose';
import { WebhookDelivery, IWebhookDelivery, DeliveryStatus } from './webhookDelivery.model';
import { PaginatedResult, PaginationQuery } from '../../types';

export interface DeliveryFilters {
  status?: DeliveryStatus;
}

export class WebhookDeliveryRepository {
  async findById(tenantId: string, deliveryId: string): Promise<IWebhookDelivery | null> {
    return WebhookDelivery.findOne({
      _id: deliveryId,
      tenantId,
      deletedAt: null,
    }).exec();
  }

  async findByIdWithoutTenant(deliveryId: string): Promise<IWebhookDelivery | null> {
    return WebhookDelivery.findOne({
      _id: deliveryId,
      deletedAt: null,
    }).exec();
  }

  async findByWebhook(
    tenantId: string,
    webhookId: string,
    query: PaginationQuery,
    filters?: DeliveryFilters
  ): Promise<PaginatedResult<IWebhookDelivery>> {
    const limit = Math.min(query.limit ?? 50, 100);
    const filter: Record<string, unknown> = {
      tenantId,
      webhookId: new Types.ObjectId(webhookId),
      deletedAt: null,
    };

    if (filters?.status) filter['status'] = filters.status;
    if (query.cursor) filter['_id'] = { $lt: query.cursor };

    const data = await WebhookDelivery.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = data.length > limit;
    if (hasMore) data.pop();

    const total = await WebhookDelivery.countDocuments({
      tenantId,
      webhookId: new Types.ObjectId(webhookId),
      deletedAt: null,
    }).exec();

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1]._id?.toString() ?? null : null,
      total,
    };
  }

  async create(data: {
    tenantId: string;
    webhookId: Types.ObjectId;
    event: string;
    payload: Record<string, unknown>;
    maxAttempts?: number;
  }): Promise<IWebhookDelivery> {
    const delivery = new WebhookDelivery({
      ...data,
      status: 'pending',
      attemptCount: 0,
      maxAttempts: data.maxAttempts ?? 5,
    });
    return delivery.save();
  }

  async update(deliveryId: string, data: Partial<IWebhookDelivery>): Promise<IWebhookDelivery | null> {
    return WebhookDelivery.findByIdAndUpdate(
      deliveryId,
      { $set: data },
      { new: true }
    ).exec();
  }

  async markDelivered(deliveryId: string, data: {
    responseStatus: number;
    responseBody?: string;
    responseHeaders?: Record<string, string>;
    duration: number;
  }): Promise<void> {
    await WebhookDelivery.updateOne(
      { _id: deliveryId },
      {
        $set: {
          status: 'delivered',
          deliveredAt: new Date(),
          responseStatus: data.responseStatus,
          responseBody: data.responseBody,
          responseHeaders: data.responseHeaders,
          duration: data.duration,
        },
        $inc: { attemptCount: 1 },
      }
    ).exec();
  }

  async markFailed(deliveryId: string, data: {
    error: string;
    responseStatus?: number;
    responseBody?: string;
    duration?: number;
  }): Promise<void> {
    await WebhookDelivery.updateOne(
      { _id: deliveryId },
      {
        $set: {
          status: 'failed',
          error: data.error,
          responseStatus: data.responseStatus,
          responseBody: data.responseBody,
          duration: data.duration,
        },
        $inc: { attemptCount: 1 },
      }
    ).exec();
  }

  async markRetrying(deliveryId: string, data: {
    error: string;
    responseStatus?: number;
    responseBody?: string;
    duration?: number;
    nextRetryAt: Date;
  }): Promise<void> {
    await WebhookDelivery.updateOne(
      { _id: deliveryId },
      {
        $set: {
          status: 'retrying',
          error: data.error,
          responseStatus: data.responseStatus,
          responseBody: data.responseBody,
          duration: data.duration,
          nextRetryAt: data.nextRetryAt,
        },
        $inc: { attemptCount: 1 },
      }
    ).exec();
  }
}
