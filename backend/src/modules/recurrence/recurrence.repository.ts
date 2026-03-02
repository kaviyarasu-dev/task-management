import { Recurrence, IRecurrence, RecurrencePattern } from './recurrence.model';
import { PaginatedResult, PaginationQuery } from '../../types';

export interface RecurrenceFilters {
  taskTemplateId?: string;
  isActive?: boolean;
}

export interface CreateRecurrenceData {
  tenantId: string;
  taskTemplateId: string;
  pattern: RecurrencePattern;
  nextOccurrence: Date;
  endDate?: Date;
  endAfterCount?: number;
  createdBy: string;
}

export class RecurrenceRepository {
  async findById(tenantId: string, recurrenceId: string): Promise<IRecurrence | null> {
    return Recurrence.findOne({
      _id: recurrenceId,
      tenantId,
      deletedAt: null,
    }).exec();
  }

  async findByTaskTemplateId(tenantId: string, taskTemplateId: string): Promise<IRecurrence | null> {
    return Recurrence.findOne({
      taskTemplateId,
      tenantId,
      deletedAt: null,
    }).exec();
  }

  async findAll(
    tenantId: string,
    filters: RecurrenceFilters,
    query: PaginationQuery
  ): Promise<PaginatedResult<IRecurrence>> {
    const limit = Math.min(query.limit ?? 20, 100);
    const filter: Record<string, unknown> = { tenantId, deletedAt: null };

    if (filters.taskTemplateId) filter['taskTemplateId'] = filters.taskTemplateId;
    if (filters.isActive !== undefined) filter['isActive'] = filters.isActive;
    if (query.cursor) filter['_id'] = { $lt: query.cursor };

    const data = await Recurrence.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = data.length > limit;
    if (hasMore) data.pop();

    const total = await Recurrence.countDocuments({ tenantId, deletedAt: null }).exec();

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1]._id?.toString() ?? null : null,
      total,
    };
  }

  /**
   * Find all active recurrences that are due for task generation.
   * Used by the recurrence processor to generate tasks.
   */
  async findDue(beforeDate?: Date): Promise<IRecurrence[]> {
    const cutoff = beforeDate ?? new Date();

    return Recurrence.find({
      isActive: true,
      deletedAt: null,
      nextOccurrence: { $lte: cutoff },
    })
      .sort({ nextOccurrence: 1 })
      .limit(100) // Process in batches
      .exec();
  }

  async create(data: CreateRecurrenceData): Promise<IRecurrence> {
    const recurrence = new Recurrence({
      ...data,
      occurrenceCount: 0,
      isActive: true,
    });
    return recurrence.save();
  }

  async update(
    tenantId: string,
    recurrenceId: string,
    data: Partial<IRecurrence>
  ): Promise<IRecurrence | null> {
    return Recurrence.findOneAndUpdate(
      { _id: recurrenceId, tenantId, deletedAt: null },
      { $set: data },
      { new: true }
    ).exec();
  }

  async incrementOccurrence(
    recurrenceId: string,
    nextOccurrence: Date,
    deactivate: boolean
  ): Promise<IRecurrence | null> {
    const updateData: Record<string, unknown> = {
      $inc: { occurrenceCount: 1 },
      $set: { nextOccurrence },
    };

    if (deactivate) {
      updateData.$set = { ...updateData.$set as object, isActive: false };
    }

    return Recurrence.findByIdAndUpdate(recurrenceId, updateData, { new: true }).exec();
  }

  async deactivate(tenantId: string, recurrenceId: string): Promise<boolean> {
    const result = await Recurrence.findOneAndUpdate(
      { _id: recurrenceId, tenantId, deletedAt: null },
      { isActive: false }
    ).exec();
    return result !== null;
  }

  async softDelete(tenantId: string, recurrenceId: string): Promise<boolean> {
    const result = await Recurrence.findOneAndUpdate(
      { _id: recurrenceId, tenantId },
      { deletedAt: new Date(), isActive: false }
    ).exec();
    return result !== null;
  }
}
