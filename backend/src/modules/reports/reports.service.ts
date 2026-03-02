import { Task } from '@modules/task/task.model';
import { RequestContext } from '@core/context/RequestContext';
import { cache } from '@infrastructure/redis/cache';
import {
  TaskMetrics,
  VelocityReport,
  VelocityPeriod,
  VelocityDataPoint,
  UserProductivity,
  MetricFilters,
  DateRange,
  StatusCount,
  PriorityCount,
  ProjectSummary,
  TeamWorkload,
  ProjectHealth,
  BurndownData,
  HealthStatus,
} from './reports.types';

export class ReportsService {
  private readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Get comprehensive task metrics for a tenant
   */
  async getTaskMetrics(filters?: MetricFilters): Promise<TaskMetrics> {
    const { tenantId } = RequestContext.get();
    const cacheKey = this.buildCacheKey('metrics', tenantId, filters);

    return cache.getOrSet(
      cacheKey,
      async () => {
        const matchStage = this.buildMatchStage(tenantId, filters);

        const result = await Task.aggregate([
          { $match: matchStage },
          {
            $lookup: {
              from: 'statuses',
              localField: 'status',
              foreignField: '_id',
              as: 'statusInfo',
            },
          },
          { $unwind: { path: '$statusInfo', preserveNullAndEmptyArrays: true } },
          {
            $facet: {
              total: [{ $count: 'count' }],
              byStatus: [
                {
                  $group: {
                    _id: '$status',
                    name: { $first: '$statusInfo.name' },
                    color: { $first: '$statusInfo.color' },
                    count: { $sum: 1 },
                  },
                },
                {
                  $project: {
                    statusId: { $toString: '$_id' },
                    name: 1,
                    color: 1,
                    count: 1,
                    _id: 0,
                  },
                },
              ],
              byPriority: [
                { $group: { _id: '$priority', count: { $sum: 1 } } },
                {
                  $project: {
                    priority: '$_id',
                    count: 1,
                    _id: 0,
                  },
                },
              ],
              completed: [
                {
                  $match: { 'statusInfo.category': 'closed' },
                },
                { $count: 'count' },
              ],
              overdue: [
                {
                  $match: {
                    dueDate: { $lt: new Date() },
                    'statusInfo.category': { $ne: 'closed' },
                  },
                },
                { $count: 'count' },
              ],
              completedThisWeek: [
                {
                  $match: {
                    'statusInfo.category': 'closed',
                    completedAt: { $gte: this.getStartOfWeek() },
                  },
                },
                { $count: 'count' },
              ],
              avgCompletionTime: [
                {
                  $match: {
                    'statusInfo.category': 'closed',
                    completedAt: { $ne: null },
                  },
                },
                {
                  $project: {
                    completionTimeHours: {
                      $divide: [
                        { $subtract: ['$completedAt', '$createdAt'] },
                        3600000,
                      ],
                    },
                  },
                },
                {
                  $group: {
                    _id: null,
                    avgHours: { $avg: '$completionTimeHours' },
                  },
                },
              ],
            },
          },
        ]);

        return this.formatMetrics(result[0]);
      },
      this.CACHE_TTL
    );
  }

  /**
   * Get task creation and completion velocity over time
   */
  async getVelocityReport(
    period: VelocityPeriod,
    range?: DateRange
  ): Promise<VelocityReport> {
    const { tenantId } = RequestContext.get();
    const cacheKey = this.buildCacheKey(
      'velocity',
      tenantId,
      { period, ...range }
    );

    return cache.getOrSet(
      cacheKey,
      async () => {
        const dateFormat = this.getDateFormat(period);
        const startDate = range?.start ?? this.getDateOffset(period, -12);
        const endDate = range?.end ?? new Date();

        const result = await Task.aggregate([
          {
            $match: {
              tenantId,
              deletedAt: null,
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $lookup: {
              from: 'statuses',
              localField: 'status',
              foreignField: '_id',
              as: 'statusInfo',
            },
          },
          { $unwind: { path: '$statusInfo', preserveNullAndEmptyArrays: true } },
          {
            $facet: {
              created: [
                {
                  $group: {
                    _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                    count: { $sum: 1 },
                  },
                },
                { $sort: { _id: 1 } },
              ],
              completed: [
                {
                  $match: { 'statusInfo.category': 'closed', completedAt: { $ne: null } },
                },
                {
                  $group: {
                    _id: { $dateToString: { format: dateFormat, date: '$completedAt' } },
                    count: { $sum: 1 },
                  },
                },
                { $sort: { _id: 1 } },
              ],
            },
          },
        ]);

        const data = this.mergeVelocityData(
          result[0]?.created ?? [],
          result[0]?.completed ?? []
        );

        return {
          period,
          data,
          averageVelocity: this.calculateAverageVelocity(result[0]?.completed ?? []),
        };
      },
      this.CACHE_TTL
    );
  }

  /**
   * Get productivity metrics per user
   */
  async getUserProductivity(dateRange?: DateRange): Promise<UserProductivity[]> {
    const { tenantId } = RequestContext.get();
    const cacheKey = this.buildCacheKey('user-productivity', tenantId, dateRange);

    return cache.getOrSet(
      cacheKey,
      async () => {
        const matchStage: Record<string, unknown> = {
          tenantId,
          deletedAt: null,
          assigneeId: { $ne: null },
        };

        if (dateRange) {
          matchStage.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
        }

        const result = await Task.aggregate([
          { $match: matchStage },
          {
            $lookup: {
              from: 'statuses',
              localField: 'status',
              foreignField: '_id',
              as: 'statusInfo',
            },
          },
          { $unwind: { path: '$statusInfo', preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: '$assigneeId',
              totalTasks: { $sum: 1 },
              completedTasks: {
                $sum: {
                  $cond: [{ $eq: ['$statusInfo.category', 'closed'] }, 1, 0],
                },
              },
              overdueTasks: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $lt: ['$dueDate', new Date()] },
                        { $ne: ['$statusInfo.category', 'closed'] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              onTimeCompletions: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ['$statusInfo.category', 'closed'] },
                        {
                          $or: [
                            { $eq: ['$dueDate', null] },
                            { $lte: ['$completedAt', '$dueDate'] },
                          ],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          {
            $lookup: {
              from: 'users',
              let: { assigneeId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: [{ $toString: '$_id' }, '$$assigneeId'],
                    },
                  },
                },
              ],
              as: 'user',
            },
          },
          { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              userId: '$_id',
              userName: {
                $concat: [
                  { $ifNull: ['$user.firstName', ''] },
                  ' ',
                  { $ifNull: ['$user.lastName', ''] },
                ],
              },
              userEmail: { $ifNull: ['$user.email', 'Unknown'] },
              totalTasks: 1,
              completedTasks: 1,
              overdueTasks: 1,
              onTimePercentage: {
                $cond: [
                  { $eq: ['$completedTasks', 0] },
                  0,
                  {
                    $round: [
                      { $multiply: [{ $divide: ['$onTimeCompletions', '$completedTasks'] }, 100] },
                      1,
                    ],
                  },
                ],
              },
            },
          },
          { $sort: { completedTasks: -1 } },
        ]);

        return result;
      },
      this.CACHE_TTL
    );
  }

  /**
   * Get average completion time in hours for completed tasks
   */
  async getAverageCompletionTime(filters?: MetricFilters): Promise<number> {
    const { tenantId } = RequestContext.get();
    const cacheKey = this.buildCacheKey('avg-completion', tenantId, filters);

    return cache.getOrSet(
      cacheKey,
      async () => {
        const matchStage = this.buildMatchStage(tenantId, filters);

        const result = await Task.aggregate([
          { $match: matchStage },
          {
            $lookup: {
              from: 'statuses',
              localField: 'status',
              foreignField: '_id',
              as: 'statusInfo',
            },
          },
          { $unwind: '$statusInfo' },
          {
            $match: {
              'statusInfo.category': 'closed',
              completedAt: { $ne: null },
            },
          },
          {
            $project: {
              completionTimeHours: {
                $divide: [
                  { $subtract: ['$completedAt', '$createdAt'] },
                  3600000,
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              avgHours: { $avg: '$completionTimeHours' },
            },
          },
        ]);

        return Math.round((result[0]?.avgHours ?? 0) * 10) / 10;
      },
      this.CACHE_TTL
    );
  }

  /**
   * Get summary metrics per project
   */
  async getProjectSummaries(): Promise<ProjectSummary[]> {
    const { tenantId } = RequestContext.get();
    const cacheKey = this.buildCacheKey('project-summaries', tenantId);

    return cache.getOrSet(
      cacheKey,
      async () => {
        const result = await Task.aggregate([
          {
            $match: {
              tenantId,
              deletedAt: null,
            },
          },
          {
            $lookup: {
              from: 'statuses',
              localField: 'status',
              foreignField: '_id',
              as: 'statusInfo',
            },
          },
          { $unwind: { path: '$statusInfo', preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: '$projectId',
              totalTasks: { $sum: 1 },
              completedTasks: {
                $sum: {
                  $cond: [{ $eq: ['$statusInfo.category', 'closed'] }, 1, 0],
                },
              },
              overdueTasks: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $lt: ['$dueDate', new Date()] },
                        { $ne: ['$statusInfo.category', 'closed'] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          {
            $lookup: {
              from: 'projects',
              let: { projectId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: [{ $toString: '$_id' }, '$$projectId'],
                    },
                  },
                },
              ],
              as: 'project',
            },
          },
          { $unwind: { path: '$project', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              projectId: '$_id',
              projectName: { $ifNull: ['$project.name', 'Unknown Project'] },
              totalTasks: 1,
              completedTasks: 1,
              overdueTasks: 1,
              completionRate: {
                $cond: [
                  { $eq: ['$totalTasks', 0] },
                  0,
                  {
                    $round: [
                      { $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] },
                      1,
                    ],
                  },
                ],
              },
            },
          },
          { $sort: { totalTasks: -1 } },
        ]);

        return result;
      },
      this.CACHE_TTL
    );
  }

  /**
   * Invalidate all report caches for a tenant
   */
  async invalidateCache(): Promise<void> {
    const { tenantId } = RequestContext.get();
    await cache.delPattern(`reports:${tenantId}:*`);
  }

  /**
   * Get workload distribution across team members
   */
  async getTeamWorkload(): Promise<TeamWorkload[]> {
    const { tenantId } = RequestContext.get();
    const cacheKey = this.buildCacheKey('team-workload', tenantId);

    return cache.getOrSet(
      cacheKey,
      async () => {
        const result = await Task.aggregate([
          {
            $match: {
              tenantId,
              deletedAt: null,
              assigneeId: { $ne: null },
            },
          },
          {
            $lookup: {
              from: 'statuses',
              localField: 'status',
              foreignField: '_id',
              as: 'statusInfo',
            },
          },
          { $unwind: { path: '$statusInfo', preserveNullAndEmptyArrays: true } },
          {
            $match: {
              'statusInfo.category': { $ne: 'closed' },
            },
          },
          {
            $group: {
              _id: '$assigneeId',
              totalTasks: { $sum: 1 },
              highPriority: {
                $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] },
              },
              urgent: {
                $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] },
              },
              overdue: {
                $sum: {
                  $cond: [{ $lt: ['$dueDate', new Date()] }, 1, 0],
                },
              },
              dueSoon: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ['$dueDate', new Date()] },
                        { $lte: ['$dueDate', this.getDateInDays(7)] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          {
            $lookup: {
              from: 'users',
              let: { assigneeId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: [{ $toString: '$_id' }, '$$assigneeId'],
                    },
                  },
                },
              ],
              as: 'user',
            },
          },
          { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              userId: '$_id',
              userName: {
                $concat: [
                  { $ifNull: ['$user.firstName', ''] },
                  ' ',
                  { $ifNull: ['$user.lastName', ''] },
                ],
              },
              userEmail: { $ifNull: ['$user.email', 'Unknown'] },
              totalTasks: 1,
              highPriority: 1,
              urgent: 1,
              overdue: 1,
              dueSoon: 1,
              workloadScore: {
                $add: [
                  '$totalTasks',
                  { $multiply: ['$urgent', 3] },
                  { $multiply: ['$highPriority', 2] },
                  { $multiply: ['$overdue', 2] },
                ],
              },
            },
          },
          { $sort: { workloadScore: -1 } },
        ]);

        return result;
      },
      this.CACHE_TTL
    );
  }

  /**
   * Get health metrics for a specific project
   */
  async getProjectHealth(projectId: string): Promise<ProjectHealth> {
    const { tenantId } = RequestContext.get();
    const cacheKey = this.buildCacheKey('project-health', tenantId, { projectId });

    return cache.getOrSet(
      cacheKey,
      async () => {
        const result = await Task.aggregate([
          {
            $match: {
              tenantId,
              projectId,
              deletedAt: null,
            },
          },
          {
            $lookup: {
              from: 'statuses',
              localField: 'status',
              foreignField: '_id',
              as: 'statusInfo',
            },
          },
          { $unwind: { path: '$statusInfo', preserveNullAndEmptyArrays: true } },
          {
            $facet: {
              summary: [
                {
                  $group: {
                    _id: null,
                    total: { $sum: 1 },
                    completed: {
                      $sum: { $cond: [{ $eq: ['$statusInfo.category', 'closed'] }, 1, 0] },
                    },
                    overdue: {
                      $sum: {
                        $cond: [
                          {
                            $and: [
                              { $lt: ['$dueDate', new Date()] },
                              { $ne: ['$statusInfo.category', 'closed'] },
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                    },
                    blocked: {
                      $sum: {
                        $cond: [{ $eq: ['$statusInfo.name', 'Blocked'] }, 1, 0],
                      },
                    },
                  },
                },
              ],
              byStatus: [
                {
                  $group: {
                    _id: '$status',
                    name: { $first: '$statusInfo.name' },
                    color: { $first: '$statusInfo.color' },
                    count: { $sum: 1 },
                  },
                },
                {
                  $project: {
                    statusId: { $toString: '$_id' },
                    name: 1,
                    color: 1,
                    count: 1,
                    _id: 0,
                  },
                },
              ],
              recentActivity: [
                { $sort: { updatedAt: -1 } },
                { $limit: 10 },
                {
                  $project: {
                    title: 1,
                    status: {
                      name: '$statusInfo.name',
                      color: '$statusInfo.color',
                    },
                    updatedAt: 1,
                  },
                },
              ],
            },
          },
        ]);

        const summary = result[0]?.summary[0] ?? {
          total: 0,
          completed: 0,
          overdue: 0,
          blocked: 0,
        };

        const healthScore = this.calculateHealthScore(summary);

        return {
          projectId,
          healthScore,
          healthStatus: this.getHealthStatus(healthScore),
          ...summary,
          completionPercentage:
            summary.total > 0
              ? Math.round((summary.completed / summary.total) * 100 * 10) / 10
              : 0,
          statusDistribution: result[0]?.byStatus ?? [],
          recentActivity: result[0]?.recentActivity ?? [],
        };
      },
      this.CACHE_TTL
    );
  }

  /**
   * Get burndown chart data for a project
   */
  async getBurndown(
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BurndownData> {
    const { tenantId } = RequestContext.get();
    const cacheKey = this.buildCacheKey('burndown', tenantId, {
      projectId,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });

    return cache.getOrSet(
      cacheKey,
      async () => {
        // Get total tasks at start
        const totalAtStart = await Task.countDocuments({
          tenantId,
          projectId,
          createdAt: { $lte: startDate },
          deletedAt: null,
        });

        // Get daily completions
        const completions = await Task.aggregate([
          {
            $match: {
              tenantId,
              projectId,
              deletedAt: null,
              completedAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $lookup: {
              from: 'statuses',
              localField: 'status',
              foreignField: '_id',
              as: 'statusInfo',
            },
          },
          { $unwind: '$statusInfo' },
          {
            $match: { 'statusInfo.category': 'closed' },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
              completed: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);

        // Get daily additions
        const additions = await Task.aggregate([
          {
            $match: {
              tenantId,
              projectId,
              createdAt: { $gte: startDate, $lte: endDate },
              deletedAt: null,
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              added: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);

        // Generate daily data points
        const data = this.generateBurndownData(
          totalAtStart,
          completions,
          additions,
          startDate,
          endDate
        );

        // Calculate ideal burndown line
        const totalDays = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const idealDaily = totalDays > 0 ? totalAtStart / totalDays : 0;

        return {
          startDate,
          endDate,
          totalAtStart,
          data,
          idealBurndown: Array.from({ length: totalDays + 1 }, (_, i) => ({
            date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            remaining: Math.max(0, Math.round(totalAtStart - idealDaily * i)),
          })),
        };
      },
      this.CACHE_TTL
    );
  }

  // --- Private helper methods ---

  private buildMatchStage(
    tenantId: string,
    filters?: MetricFilters
  ): Record<string, unknown> {
    const match: Record<string, unknown> = {
      tenantId,
      deletedAt: null,
    };

    if (filters?.projectId) {
      match.projectId = filters.projectId;
    }
    if (filters?.assigneeId) {
      match.assigneeId = filters.assigneeId;
    }
    if (filters?.startDate || filters?.endDate) {
      match.createdAt = {};
      if (filters?.startDate) {
        (match.createdAt as Record<string, unknown>).$gte = filters.startDate;
      }
      if (filters?.endDate) {
        (match.createdAt as Record<string, unknown>).$lte = filters.endDate;
      }
    }

    return match;
  }

  private buildCacheKey(
    type: string,
    tenantId: string,
    params?: object
  ): string {
    const paramsStr = params ? `:${JSON.stringify(params)}` : '';
    return `reports:${tenantId}:${type}${paramsStr}`;
  }

  private getStartOfWeek(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  private getDateFormat(period: VelocityPeriod): string {
    switch (period) {
      case 'daily':
        return '%Y-%m-%d';
      case 'weekly':
        return '%Y-W%V';
      case 'monthly':
        return '%Y-%m';
    }
  }

  private getDateOffset(period: VelocityPeriod, count: number): Date {
    const date = new Date();
    switch (period) {
      case 'daily':
        date.setDate(date.getDate() + count);
        break;
      case 'weekly':
        date.setDate(date.getDate() + count * 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + count);
        break;
    }
    return date;
  }

  private formatMetrics(raw: Record<string, unknown[]>): TaskMetrics {
    const getCount = (arr: Array<{ count: number }> | undefined): number =>
      arr?.[0]?.count ?? 0;

    const getAvg = (arr: Array<{ avgHours: number }> | undefined): number =>
      Math.round((arr?.[0]?.avgHours ?? 0) * 10) / 10;

    return {
      totalTasks: getCount(raw.total as Array<{ count: number }>),
      completedTasks: getCount(raw.completed as Array<{ count: number }>),
      overdueCount: getCount(raw.overdue as Array<{ count: number }>),
      completedThisWeek: getCount(raw.completedThisWeek as Array<{ count: number }>),
      averageCompletionTimeHours: getAvg(raw.avgCompletionTime as Array<{ avgHours: number }>),
      statusDistribution: (raw.byStatus as StatusCount[]) ?? [],
      priorityDistribution: (raw.byPriority as PriorityCount[]) ?? [],
    };
  }

  private mergeVelocityData(
    created: Array<{ _id: string; count: number }>,
    completed: Array<{ _id: string; count: number }>
  ): VelocityDataPoint[] {
    const allDates = new Set([
      ...created.map((c) => c._id),
      ...completed.map((c) => c._id),
    ]);

    const createdMap = new Map(created.map((c) => [c._id, c.count]));
    const completedMap = new Map(completed.map((c) => [c._id, c.count]));

    return Array.from(allDates)
      .sort()
      .map((date) => ({
        date,
        created: createdMap.get(date) ?? 0,
        completed: completedMap.get(date) ?? 0,
      }));
  }

  private calculateAverageVelocity(
    completed: Array<{ _id: string; count: number }>
  ): number {
    if (completed.length === 0) return 0;
    const total = completed.reduce((sum, c) => sum + c.count, 0);
    return Math.round((total / completed.length) * 10) / 10;
  }

  private getDateInDays(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  private calculateHealthScore(summary: {
    total: number;
    completed: number;
    overdue: number;
    blocked: number;
  }): number {
    if (summary.total === 0) return 100;

    const completionRate = summary.completed / summary.total;
    const overdueRate = summary.overdue / summary.total;
    const blockedRate = summary.blocked / summary.total;

    // Weight factors: completion (50%), non-overdue (30%), non-blocked (20%)
    const score =
      completionRate * 50 + (1 - overdueRate) * 30 + (1 - blockedRate) * 20;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private getHealthStatus(score: number): HealthStatus {
    if (score >= 70) return 'healthy';
    if (score >= 40) return 'at-risk';
    return 'critical';
  }

  private generateBurndownData(
    totalAtStart: number,
    completions: Array<{ _id: string; completed: number }>,
    additions: Array<{ _id: string; added: number }>,
    startDate: Date,
    endDate: Date
  ): Array<{ date: string; remaining: number; added?: number; completed?: number }> {
    const completionMap = new Map(completions.map((c) => [c._id, c.completed]));
    const additionMap = new Map(additions.map((a) => [a._id, a.added]));

    const data: Array<{
      date: string;
      remaining: number;
      added?: number;
      completed?: number;
    }> = [];

    let remaining = totalAtStart;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const completed = completionMap.get(dateStr) ?? 0;
      const added = additionMap.get(dateStr) ?? 0;

      remaining = remaining - completed + added;

      data.push({
        date: dateStr,
        remaining: Math.max(0, remaining),
        added: added > 0 ? added : undefined,
        completed: completed > 0 ? completed : undefined,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  }
}

export const reportsService = new ReportsService();
