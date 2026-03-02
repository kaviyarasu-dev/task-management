export type ActivityEntityType =
  | 'task'
  | 'project'
  | 'comment'
  | 'status'
  | 'user'
  | 'invitation'
  | 'tenant';

export type ActivityAction =
  // Task actions
  | 'task.created'
  | 'task.updated'
  | 'task.assigned'
  | 'task.completed'
  | 'task.deleted'
  // Comment actions
  | 'comment.created'
  | 'comment.updated'
  | 'comment.deleted'
  // Project actions
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  // Status actions
  | 'status.created'
  | 'status.updated'
  | 'status.deleted'
  // User/Invitation actions
  | 'user.invited'
  | 'user.removed'
  | 'invitation.created'
  | 'invitation.accepted'
  | 'invitation.cancelled'
  // Tenant actions
  | 'tenant.created';

export interface ActivityActor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Activity {
  _id: string;
  tenantId: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  actorId: ActivityActor;
  metadata: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityFilters {
  entityType?: ActivityEntityType;
  action?: ActivityAction;
  actorId?: string;
  cursor?: string;
  limit?: number;
}
