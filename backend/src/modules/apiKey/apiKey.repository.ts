import { Types } from 'mongoose';
import { ApiKey, IApiKey, ApiKeyPermission } from './apiKey.model';

export interface CreateApiKeyData {
  tenantId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions: ApiKeyPermission[];
  expiresAt?: Date;
  rateLimit?: number;
  createdBy: string;
}

export class ApiKeyRepository {
  async create(data: CreateApiKeyData): Promise<IApiKey> {
    const apiKey = new ApiKey({
      ...data,
      createdBy: new Types.ObjectId(data.createdBy),
      isActive: true,
      usageCount: 0,
    });
    return apiKey.save();
  }

  async findById(tenantId: string, apiKeyId: string): Promise<IApiKey | null> {
    return ApiKey.findOne({
      _id: apiKeyId,
      tenantId,
      deletedAt: null,
    }).exec();
  }

  async findByPrefix(keyPrefix: string): Promise<IApiKey[]> {
    return ApiKey.find({
      keyPrefix,
      isActive: true,
      deletedAt: null,
    }).exec();
  }

  async findByTenant(tenantId: string): Promise<IApiKey[]> {
    return ApiKey.find({
      tenantId,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findActiveByTenant(tenantId: string): Promise<IApiKey[]> {
    return ApiKey.find({
      tenantId,
      isActive: true,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(
    tenantId: string,
    apiKeyId: string,
    data: Partial<Pick<IApiKey, 'name' | 'permissions' | 'expiresAt' | 'rateLimit' | 'isActive'>>
  ): Promise<IApiKey | null> {
    return ApiKey.findOneAndUpdate(
      { _id: apiKeyId, tenantId, deletedAt: null },
      { $set: data },
      { new: true }
    ).exec();
  }

  async updateUsage(
    apiKeyId: string,
    data: { lastUsedAt: Date; lastUsedIp?: string }
  ): Promise<void> {
    await ApiKey.findByIdAndUpdate(apiKeyId, {
      $set: { lastUsedAt: data.lastUsedAt, lastUsedIp: data.lastUsedIp },
      $inc: { usageCount: 1 },
    }).exec();
  }

  async updateKeyHash(
    tenantId: string,
    apiKeyId: string,
    keyHash: string,
    keyPrefix: string
  ): Promise<IApiKey | null> {
    return ApiKey.findOneAndUpdate(
      { _id: apiKeyId, tenantId, deletedAt: null },
      {
        $set: {
          keyHash,
          keyPrefix,
          usageCount: 0,
        },
      },
      { new: true }
    ).exec();
  }

  async softDelete(tenantId: string, apiKeyId: string): Promise<boolean> {
    const result = await ApiKey.findOneAndUpdate(
      { _id: apiKeyId, tenantId, deletedAt: null },
      { deletedAt: new Date(), isActive: false }
    ).exec();
    return result !== null;
  }

  async countByTenant(tenantId: string): Promise<number> {
    return ApiKey.countDocuments({
      tenantId,
      deletedAt: null,
    }).exec();
  }
}
