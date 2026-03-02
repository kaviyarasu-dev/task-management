import { Types } from 'mongoose';
import { Activity, IActivity, ActivityEntityType } from './activity.model';
import { PaginatedResult, PaginationQuery } from '../../types';

export interface ActivityFilters {
  entityType?: ActivityEntityType;
  entityId?: string;
  actorId?: string;
  action?: string;
}

export class ActivityRepository {
  async findById(tenantId: string, activityId: string): Promise<IActivity | null> {
    return Activity.findOne({ _id: activityId, tenantId, deletedAt: null })
      .populate('actorId', 'firstName lastName email')
      .exec();
  }

  async findRecent(
    tenantId: string,
    query: PaginationQuery
  ): Promise<PaginatedResult<IActivity>> {
    const limit = Math.min(query.limit ?? 20, 100);
    const filter: Record<string, unknown> = { tenantId, deletedAt: null };

    if (query.cursor) {
      filter['_id'] = { $lt: query.cursor };
    }

    const data = await Activity.find(filter)
      .sort({ occurredAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate('actorId', 'firstName lastName email')
      .exec();

    const hasMore = data.length > limit;
    if (hasMore) data.pop();

    const total = await Activity.countDocuments({ tenantId, deletedAt: null }).exec();

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1]._id?.toString() ?? null : null,
      total,
    };
  }

  async findByEntity(
    tenantId: string,
    entityType: ActivityEntityType,
    entityId: string,
    query: PaginationQuery
  ): Promise<PaginatedResult<IActivity>> {
    const limit = Math.min(query.limit ?? 50, 100);
    const filter: Record<string, unknown> = {
      tenantId,
      entityType,
      entityId: new Types.ObjectId(entityId),
      deletedAt: null,
    };

    if (query.cursor) {
      filter['_id'] = { $lt: query.cursor };
    }

    const data = await Activity.find(filter)
      .sort({ occurredAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate('actorId', 'firstName lastName email')
      .exec();

    const hasMore = data.length > limit;
    if (hasMore) data.pop();

    const total = await Activity.countDocuments({
      tenantId,
      entityType,
      entityId: new Types.ObjectId(entityId),
      deletedAt: null,
    }).exec();

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1]._id?.toString() ?? null : null,
      total,
    };
  }

  async findByActor(
    tenantId: string,
    actorId: string,
    query: PaginationQuery
  ): Promise<PaginatedResult<IActivity>> {
    const limit = Math.min(query.limit ?? 50, 100);
    const filter: Record<string, unknown> = {
      tenantId,
      actorId: new Types.ObjectId(actorId),
      deletedAt: null,
    };

    if (query.cursor) {
      filter['_id'] = { $lt: query.cursor };
    }

    const data = await Activity.find(filter)
      .sort({ occurredAt: -1, _id: -1 })
      .limit(limit + 1)
      .populate('actorId', 'firstName lastName email')
      .exec();

    const hasMore = data.length > limit;
    if (hasMore) data.pop();

    const total = await Activity.countDocuments({
      tenantId,
      actorId: new Types.ObjectId(actorId),
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
    entityType: ActivityEntityType;
    entityId: string;
    action: string;
    actorId: string;
    metadata?: Record<string, unknown>;
    occurredAt?: Date;
  }): Promise<IActivity> {
    const activity = new Activity({
      tenantId: data.tenantId,
      entityType: data.entityType,
      entityId: new Types.ObjectId(data.entityId),
      action: data.action,
      actorId: new Types.ObjectId(data.actorId),
      metadata: data.metadata ?? {},
      occurredAt: data.occurredAt ?? new Date(),
    });
    return activity.save();
  }
}
