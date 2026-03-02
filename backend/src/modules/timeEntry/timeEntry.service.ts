import { TimeEntryRepository, TimeEntryFilters, DateRange } from './timeEntry.repository';
import { RequestContext } from '@core/context/RequestContext';
import { NotFoundError, AppError } from '@core/errors/AppError';
import { EventBus } from '@core/events/EventBus';
import { ITimeEntry } from './timeEntry.model';
import { PaginatedResult, PaginationQuery } from '../../types';

export interface CreateTimeEntryDTO {
  taskId: string;
  description?: string;
  startedAt: Date;
  endedAt: Date;
  durationMinutes: number;
  billable?: boolean;
}

export interface UpdateTimeEntryDTO {
  description?: string;
  billable?: boolean;
  durationMinutes?: number;
}

export interface WeeklyTimeReport {
  userId: string;
  weekStart: Date;
  totalMinutes: number;
  byDay: Array<{
    date: string;
    minutes: number;
  }>;
}

// Helper functions for date calculations
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

function sum(numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}

export class TimeEntryService {
  private repo: TimeEntryRepository;

  constructor() {
    this.repo = new TimeEntryRepository();
  }

  async startTimer(taskId: string, description?: string): Promise<ITimeEntry> {
    const { tenantId, userId } = RequestContext.get();

    // Check for existing active timer
    const activeTimer = await this.getActiveTimer();
    if (activeTimer) {
      throw new AppError('Timer already running. Stop it first.', 400);
    }

    const entry = await this.repo.create({
      tenantId,
      taskId,
      userId,
      description,
      startedAt: new Date(),
      billable: false,
    });

    await EventBus.emit('timer.started', {
      entryId: entry._id?.toString() ?? '',
      taskId,
      tenantId,
      userId,
    });

    return entry;
  }

  async stopTimer(entryId: string): Promise<ITimeEntry> {
    const { tenantId, userId } = RequestContext.get();

    const entry = await this.repo.findById(tenantId, entryId);
    if (!entry || entry.userId.toString() !== userId) {
      throw new NotFoundError('Timer');
    }

    if (entry.endedAt) {
      throw new AppError('Timer already stopped', 400);
    }

    const endedAt = new Date();
    const durationMinutes = Math.round(
      (endedAt.getTime() - entry.startedAt.getTime()) / 60000
    );

    const updated = await this.repo.update(tenantId, entryId, {
      endedAt,
      durationMinutes,
    });

    if (!updated) {
      throw new NotFoundError('Timer');
    }

    await EventBus.emit('timer.stopped', {
      entryId: entry._id?.toString() ?? '',
      taskId: entry.taskId.toString(),
      tenantId,
      durationMinutes,
    });

    return updated;
  }

  async getActiveTimer(): Promise<ITimeEntry | null> {
    const { tenantId, userId } = RequestContext.get();
    return this.repo.findActiveByUser(tenantId, userId);
  }

  async createManualEntry(data: CreateTimeEntryDTO): Promise<ITimeEntry> {
    const { tenantId, userId } = RequestContext.get();

    const entry = await this.repo.create({
      tenantId,
      taskId: data.taskId,
      userId,
      description: data.description,
      startedAt: data.startedAt,
      endedAt: data.endedAt,
      durationMinutes: data.durationMinutes,
      billable: data.billable ?? false,
    });

    await EventBus.emit('timeEntry.created', {
      entryId: entry._id?.toString() ?? '',
      taskId: data.taskId,
      tenantId,
      userId,
      durationMinutes: data.durationMinutes,
    });

    return entry;
  }

  async getTaskTotal(taskId: string): Promise<number> {
    const { tenantId } = RequestContext.get();
    return this.repo.sumDuration(tenantId, { taskId });
  }

  async getProjectTotal(
    _projectId: string,
    dateRange?: DateRange
  ): Promise<number> {
    const { tenantId } = RequestContext.get();
    // TODO: This requires getting tasks by project from TaskService
    // For now, we return sum of all time entries in the date range
    // Implement properly when TaskService is injected
    return this.repo.sumDuration(tenantId, { startedAt: dateRange?.startedAt });
  }

  async getUserWeeklyReport(targetUserId?: string): Promise<WeeklyTimeReport> {
    const { tenantId, userId } = RequestContext.get();
    const reportUserId = targetUserId || userId;

    const startOfWeek = getStartOfWeek(new Date());
    const entries = await this.repo.findByUser(tenantId, reportUserId, {
      startedAt: { $gte: startOfWeek },
    });

    // Group by day
    const byDay = groupBy(entries, (e) => e.startedAt.toDateString());

    return {
      userId: reportUserId,
      weekStart: startOfWeek,
      totalMinutes: sum(entries.map((e) => e.durationMinutes || 0)),
      byDay: Object.entries(byDay).map(([date, dayEntries]) => ({
        date,
        minutes: sum(dayEntries.map((e) => e.durationMinutes || 0)),
      })),
    };
  }

  async list(
    filters: TimeEntryFilters,
    query: PaginationQuery
  ): Promise<PaginatedResult<ITimeEntry>> {
    const { tenantId } = RequestContext.get();
    return this.repo.findAll(tenantId, filters, query, { populate: ['task', 'user'] });
  }

  async listByTask(taskId: string): Promise<ITimeEntry[]> {
    const { tenantId } = RequestContext.get();
    return this.repo.findByTask(tenantId, taskId, { populate: ['user'] });
  }

  async listByUser(userId: string, filters?: DateRange): Promise<ITimeEntry[]> {
    const { tenantId } = RequestContext.get();
    return this.repo.findByUser(tenantId, userId, filters);
  }

  async update(entryId: string, data: UpdateTimeEntryDTO): Promise<ITimeEntry> {
    const { tenantId, userId } = RequestContext.get();

    const entry = await this.repo.findById(tenantId, entryId);
    if (!entry || entry.userId.toString() !== userId) {
      throw new NotFoundError('Time entry');
    }

    const updated = await this.repo.update(tenantId, entryId, data);
    if (!updated) {
      throw new NotFoundError('Time entry');
    }

    await EventBus.emit('timeEntry.updated', {
      entryId,
      taskId: entry.taskId.toString(),
      tenantId,
      userId,
    });

    return updated;
  }

  async delete(entryId: string): Promise<void> {
    const { tenantId, userId } = RequestContext.get();

    const entry = await this.repo.findById(tenantId, entryId);
    if (!entry || entry.userId.toString() !== userId) {
      throw new NotFoundError('Time entry');
    }

    await this.repo.softDelete(tenantId, entryId);

    await EventBus.emit('timeEntry.deleted', {
      entryId,
      taskId: entry.taskId.toString(),
      tenantId,
      deletedBy: userId,
    });
  }

  async getById(entryId: string): Promise<ITimeEntry> {
    const { tenantId } = RequestContext.get();
    const entry = await this.repo.findById(tenantId, entryId, { populate: ['task', 'user'] });
    if (!entry) {
      throw new NotFoundError('Time entry');
    }
    return entry;
  }
}
