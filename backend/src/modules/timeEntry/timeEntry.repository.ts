import { Types, FilterQuery } from 'mongoose';
import { TimeEntry, ITimeEntry } from './timeEntry.model';
import { PaginatedResult, PaginationQuery } from '../../types';

export interface TimeEntryFilters {
  taskId?: string;
  userId?: string;
  startedAfter?: Date;
  startedBefore?: Date;
  billable?: boolean;
}

export interface DateRange {
  startedAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}

export interface FindOptions {
  populate?: ('task' | 'user')[];
}

export class TimeEntryRepository {
  async findById(
    tenantId: string,
    entryId: string,
    options?: FindOptions
  ): Promise<ITimeEntry | null> {
    let queryBuilder = TimeEntry.findOne({
      _id: entryId,
      tenantId,
      deletedAt: null,
    });

    if (options?.populate?.includes('task')) {
      queryBuilder = queryBuilder.populate('taskId');
    }
    if (options?.populate?.includes('user')) {
      queryBuilder = queryBuilder.populate('userId');
    }

    return queryBuilder.exec();
  }

  async findActiveByUser(tenantId: string, userId: string): Promise<ITimeEntry | null> {
    return TimeEntry.findOne({
      tenantId,
      userId: new Types.ObjectId(userId),
      endedAt: null,
      deletedAt: null,
    }).exec();
  }

  async findByTask(
    tenantId: string,
    taskId: string,
    options?: FindOptions
  ): Promise<ITimeEntry[]> {
    let queryBuilder = TimeEntry.find({
      tenantId,
      taskId: new Types.ObjectId(taskId),
      deletedAt: null,
    }).sort({ startedAt: -1 });

    if (options?.populate?.includes('user')) {
      queryBuilder = queryBuilder.populate('userId');
    }

    return queryBuilder.exec();
  }

  async findByUser(
    tenantId: string,
    userId: string,
    filters?: DateRange
  ): Promise<ITimeEntry[]> {
    const query: FilterQuery<ITimeEntry> = {
      tenantId,
      userId: new Types.ObjectId(userId),
      deletedAt: null,
    };

    if (filters?.startedAt) {
      query.startedAt = filters.startedAt;
    }

    return TimeEntry.find(query)
      .sort({ startedAt: -1 })
      .populate('taskId')
      .exec();
  }

  async findAll(
    tenantId: string,
    filters: TimeEntryFilters,
    query: PaginationQuery,
    options?: FindOptions
  ): Promise<PaginatedResult<ITimeEntry>> {
    const limit = Math.min(query.limit ?? 20, 100);
    const filter: FilterQuery<ITimeEntry> = { tenantId, deletedAt: null };

    if (filters.taskId) {
      filter.taskId = new Types.ObjectId(filters.taskId);
    }
    if (filters.userId) {
      filter.userId = new Types.ObjectId(filters.userId);
    }
    if (filters.billable !== undefined) {
      filter.billable = filters.billable;
    }
    if (filters.startedAfter) {
      filter.startedAt = { ...filter.startedAt, $gte: filters.startedAfter };
    }
    if (filters.startedBefore) {
      filter.startedAt = { ...filter.startedAt, $lte: filters.startedBefore };
    }
    if (query.cursor) {
      filter._id = { $lt: new Types.ObjectId(query.cursor) };
    }

    let queryBuilder = TimeEntry.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1);

    if (options?.populate?.includes('task')) {
      queryBuilder = queryBuilder.populate('taskId');
    }
    if (options?.populate?.includes('user')) {
      queryBuilder = queryBuilder.populate('userId');
    }

    const data = await queryBuilder.exec();

    const hasMore = data.length > limit;
    if (hasMore) data.pop();

    const total = await TimeEntry.countDocuments({
      tenantId,
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
    taskId: string;
    userId: string;
    description?: string;
    startedAt: Date;
    endedAt?: Date;
    durationMinutes?: number;
    billable?: boolean;
  }): Promise<ITimeEntry> {
    const entry = new TimeEntry({
      ...data,
      taskId: new Types.ObjectId(data.taskId),
      userId: new Types.ObjectId(data.userId),
    });
    return entry.save();
  }

  async update(
    tenantId: string,
    entryId: string,
    data: Partial<Pick<ITimeEntry, 'description' | 'endedAt' | 'durationMinutes' | 'billable'>>
  ): Promise<ITimeEntry | null> {
    return TimeEntry.findOneAndUpdate(
      { _id: entryId, tenantId, deletedAt: null },
      { $set: data },
      { new: true }
    ).exec();
  }

  async softDelete(tenantId: string, entryId: string): Promise<boolean> {
    const result = await TimeEntry.findOneAndUpdate(
      { _id: entryId, tenantId, deletedAt: null },
      { deletedAt: new Date() }
    ).exec();
    return result !== null;
  }

  async sumDuration(
    tenantId: string,
    filter: { taskId?: string | { $in: string[] }; startedAt?: DateRange['startedAt'] }
  ): Promise<number> {
    const matchFilter: FilterQuery<ITimeEntry> = {
      tenantId,
      deletedAt: null,
      durationMinutes: { $ne: null },
    };

    if (filter.taskId) {
      if (typeof filter.taskId === 'string') {
        matchFilter.taskId = new Types.ObjectId(filter.taskId);
      } else if ('$in' in filter.taskId) {
        matchFilter.taskId = { $in: filter.taskId.$in.map((id) => new Types.ObjectId(id)) };
      }
    }

    if (filter.startedAt) {
      matchFilter.startedAt = filter.startedAt;
    }

    const result = await TimeEntry.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, total: { $sum: '$durationMinutes' } } },
    ]).exec();

    return result.length > 0 ? result[0].total : 0;
  }
}
