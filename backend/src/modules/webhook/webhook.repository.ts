import { Types } from 'mongoose';
import { Webhook, IWebhook } from './webhook.model';
import { PaginatedResult, PaginationQuery } from '../../types';

export interface WebhookFilters {
  isActive?: boolean;
  event?: string;
}

export class WebhookRepository {
  async findById(tenantId: string, webhookId: string): Promise<IWebhook | null> {
    return Webhook.findOne({
      _id: webhookId,
      tenantId,
      deletedAt: null,
    }).exec();
  }

  async findAll(
    tenantId: string,
    filters: WebhookFilters,
    query: PaginationQuery
  ): Promise<PaginatedResult<IWebhook>> {
    const limit = Math.min(query.limit ?? 20, 100);
    const filter: Record<string, unknown> = { tenantId, deletedAt: null };

    if (filters.isActive !== undefined) filter['isActive'] = filters.isActive;
    if (filters.event) filter['events'] = filters.event;
    if (query.cursor) filter['_id'] = { $lt: query.cursor };

    const data = await Webhook.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = data.length > limit;
    if (hasMore) data.pop();

    const total = await Webhook.countDocuments({ tenantId, deletedAt: null }).exec();

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1]._id?.toString() ?? null : null,
      total,
    };
  }

  async findByEvent(tenantId: string, event: string): Promise<IWebhook[]> {
    return Webhook.find({
      tenantId,
      events: event,
      isActive: true,
      deletedAt: null,
    }).exec();
  }

  async create(data: {
    tenantId: string;
    name: string;
    url: string;
    secret: string;
    events: string[];
    createdBy: Types.ObjectId;
    headers?: Record<string, string>;
  }): Promise<IWebhook> {
    const webhook = new Webhook(data);
    return webhook.save();
  }

  async update(tenantId: string, webhookId: string, data: Partial<IWebhook>): Promise<IWebhook | null> {
    return Webhook.findOneAndUpdate(
      { _id: webhookId, tenantId },
      { $set: data },
      { new: true }
    ).exec();
  }

  async softDelete(tenantId: string, webhookId: string): Promise<boolean> {
    const result = await Webhook.findOneAndUpdate(
      { _id: webhookId, tenantId },
      { deletedAt: new Date() }
    ).exec();
    return result !== null;
  }

  async incrementFailureCount(webhookId: string): Promise<void> {
    await Webhook.updateOne(
      { _id: webhookId },
      {
        $inc: { failureCount: 1 },
        $set: { lastDeliveryStatus: 'failed' },
      }
    ).exec();
  }

  async resetFailureCount(webhookId: string): Promise<void> {
    await Webhook.updateOne(
      { _id: webhookId },
      {
        $set: {
          failureCount: 0,
          lastDeliveryStatus: 'success',
          lastDeliveryAt: new Date(),
        },
      }
    ).exec();
  }

  async disableWebhook(webhookId: string): Promise<void> {
    await Webhook.updateOne(
      { _id: webhookId },
      { $set: { isActive: false } }
    ).exec();
  }
}
