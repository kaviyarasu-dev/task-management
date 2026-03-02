import { Request, Response } from 'express';
import { ApiKeyService } from './apiKey.service';
import {
  createApiKeySchema,
  updateApiKeySchema,
  apiKeyIdParamSchema,
} from '@api/validators/apiKey.validator';

const apiKeyService = new ApiKeyService();

export const apiKeyController = {
  async list(_req: Request, res: Response): Promise<void> {
    const apiKeys = await apiKeyService.list();

    // Never expose key hashes in responses
    const safeApiKeys = apiKeys.map((key) => ({
      id: key._id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      permissions: key.permissions,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
      usageCount: key.usageCount,
      rateLimit: key.rateLimit,
      isActive: key.isActive,
      createdAt: key.createdAt,
      createdBy: key.createdBy,
    }));

    res.json({ success: true, data: safeApiKeys });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = apiKeyIdParamSchema.parse(req.params);
    const apiKey = await apiKeyService.getById(id);

    // Never expose key hash
    res.json({
      success: true,
      data: {
        id: apiKey._id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
        lastUsedAt: apiKey.lastUsedAt,
        lastUsedIp: apiKey.lastUsedIp,
        usageCount: apiKey.usageCount,
        rateLimit: apiKey.rateLimit,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
        createdBy: apiKey.createdBy,
      },
    });
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = createApiKeySchema.parse(req.body);
    const { apiKey, rawKey } = await apiKeyService.create(input);

    // Return the raw key only during creation
    res.status(201).json({
      success: true,
      data: {
        id: apiKey._id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
        rateLimit: apiKey.rateLimit,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
      },
      // WARNING: This is the only time the full key is returned
      key: rawKey,
      message: 'Store this API key securely. It will not be shown again.',
    });
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = apiKeyIdParamSchema.parse(req.params);
    const input = updateApiKeySchema.parse(req.body);
    const apiKey = await apiKeyService.update(id, input);

    res.json({
      success: true,
      data: {
        id: apiKey._id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
        rateLimit: apiKey.rateLimit,
        isActive: apiKey.isActive,
        updatedAt: apiKey.updatedAt,
      },
    });
  },

  async revoke(req: Request, res: Response): Promise<void> {
    const { id } = apiKeyIdParamSchema.parse(req.params);
    await apiKeyService.revoke(id);
    res.json({ success: true, message: 'API key revoked' });
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = apiKeyIdParamSchema.parse(req.params);
    await apiKeyService.delete(id);
    res.json({ success: true, message: 'API key deleted' });
  },

  async regenerate(req: Request, res: Response): Promise<void> {
    const { id } = apiKeyIdParamSchema.parse(req.params);
    const { apiKey, rawKey } = await apiKeyService.regenerate(id);

    res.json({
      success: true,
      data: {
        id: apiKey._id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        isActive: apiKey.isActive,
      },
      // WARNING: This is the only time the full key is returned
      key: rawKey,
      message: 'Store this API key securely. It will not be shown again.',
    });
  },
};
