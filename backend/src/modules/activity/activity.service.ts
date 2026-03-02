import { ActivityRepository } from './activity.repository';
import { RequestContext } from '@core/context/RequestContext';
import { NotFoundError } from '@core/errors/AppError';
import { IActivity, ActivityEntityType } from './activity.model';
import { Task } from '../task/task.model';
import { User } from '../user/user.model';
import { PaginatedResult, PaginationQuery } from '../../types';

export class ActivityService {
  private repo: ActivityRepository;

  constructor() {
    this.repo = new ActivityRepository();
  }

  async getRecent(query: PaginationQuery): Promise<PaginatedResult<IActivity>> {
    const { tenantId } = RequestContext.get();
    return this.repo.findRecent(tenantId, query);
  }

  async getTaskActivity(
    taskId: string,
    query: PaginationQuery
  ): Promise<PaginatedResult<IActivity>> {
    const { tenantId } = RequestContext.get();

    // Verify task exists
    const task = await Task.findOne({ _id: taskId, tenantId, deletedAt: null }).exec();
    if (!task) throw new NotFoundError('Task');

    return this.repo.findByEntity(tenantId, 'task', taskId, query);
  }

  async getProjectActivity(
    projectId: string,
    query: PaginationQuery
  ): Promise<PaginatedResult<IActivity>> {
    const { tenantId } = RequestContext.get();
    return this.repo.findByEntity(tenantId, 'project', projectId, query);
  }

  async getUserActivity(
    userId: string,
    query: PaginationQuery
  ): Promise<PaginatedResult<IActivity>> {
    const { tenantId } = RequestContext.get();

    // Verify user exists in tenant
    const user = await User.findOne({ _id: userId, tenantId, deletedAt: null }).exec();
    if (!user) throw new NotFoundError('User');

    return this.repo.findByActor(tenantId, userId, query);
  }

  async getEntityActivity(
    entityType: ActivityEntityType,
    entityId: string,
    query: PaginationQuery
  ): Promise<PaginatedResult<IActivity>> {
    const { tenantId } = RequestContext.get();
    return this.repo.findByEntity(tenantId, entityType, entityId, query);
  }
}
