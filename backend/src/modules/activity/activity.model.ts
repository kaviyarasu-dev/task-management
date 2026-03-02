import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';

export type ActivityEntityType =
  | 'task'
  | 'project'
  | 'comment'
  | 'status'
  | 'user'
  | 'invitation'
  | 'tenant';

export interface IActivity extends BaseDocument {
  entityType: ActivityEntityType;
  entityId: Types.ObjectId;
  action: string; // Event name: 'task.created', 'comment.created', etc.
  actorId: Types.ObjectId;
  metadata: Record<string, unknown>;
  occurredAt: Date;
}

const activitySchema = new Schema<IActivity>({
  entityType: {
    type: String,
    enum: ['task', 'project', 'comment', 'status', 'user', 'invitation', 'tenant'],
    required: true,
  },
  entityId: { type: Schema.Types.ObjectId, required: true },
  action: { type: String, required: true },
  actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  occurredAt: { type: Date, default: Date.now },
});

applyBaseSchema(activitySchema);

// Most common query: recent activity for a tenant
activitySchema.index({ tenantId: 1, occurredAt: -1 });
// Activity for a specific entity (e.g., all task activities)
activitySchema.index({ tenantId: 1, entityType: 1, entityId: 1, occurredAt: -1 });
// Activity by a specific user
activitySchema.index({ tenantId: 1, actorId: 1, occurredAt: -1 });

export const Activity = model<IActivity>('Activity', activitySchema);
