import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';

export const API_KEY_PERMISSIONS = [
  'tasks:read',
  'tasks:write',
  'projects:read',
  'projects:write',
  'users:read',
  'reports:read',
] as const;

export type ApiKeyPermission = (typeof API_KEY_PERMISSIONS)[number];

export interface IApiKey extends BaseDocument {
  name: string;
  keyHash: string;
  keyPrefix: string; // First 12 chars for identification (tsk_ + 8 chars)
  permissions: ApiKeyPermission[];
  expiresAt?: Date;
  lastUsedAt?: Date;
  lastUsedIp?: string;
  usageCount: number;
  rateLimit: number; // requests per minute
  isActive: boolean;
  createdBy: Types.ObjectId;
}

const apiKeySchema = new Schema<IApiKey>({
  name: { type: String, required: true, trim: true },
  keyHash: { type: String, required: true },
  keyPrefix: { type: String, required: true, index: true },
  permissions: [{
    type: String,
    enum: API_KEY_PERMISSIONS,
  }],
  expiresAt: { type: Date },
  lastUsedAt: { type: Date },
  lastUsedIp: { type: String },
  usageCount: { type: Number, default: 0 },
  rateLimit: { type: Number, default: 60 }, // 60 req/min default
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

applyBaseSchema(apiKeySchema);

// Compound indexes for common query patterns
apiKeySchema.index({ tenantId: 1, keyPrefix: 1 });
apiKeySchema.index({ tenantId: 1, isActive: 1 });
apiKeySchema.index({ tenantId: 1, createdBy: 1 });

export const ApiKey = model<IApiKey>('ApiKey', apiKeySchema);
