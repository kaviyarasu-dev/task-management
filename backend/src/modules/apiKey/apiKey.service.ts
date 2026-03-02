import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { ApiKeyRepository } from './apiKey.repository';
import { IApiKey, ApiKeyPermission } from './apiKey.model';
import { RequestContext } from '@core/context/RequestContext';
import { NotFoundError, ForbiddenError, BadRequestError } from '@core/errors/AppError';

const SALT_ROUNDS = 10;
const MAX_API_KEYS_PER_TENANT = 20;

export interface CreateApiKeyDTO {
  name: string;
  permissions: ApiKeyPermission[];
  expiresAt?: Date;
  rateLimit?: number;
}

export interface UpdateApiKeyDTO {
  name?: string;
  permissions?: ApiKeyPermission[];
  expiresAt?: Date;
  rateLimit?: number;
  isActive?: boolean;
}

export class ApiKeyService {
  private repo: ApiKeyRepository;

  constructor() {
    this.repo = new ApiKeyRepository();
  }

  /**
   * Generate a new API key. The raw key is only returned once during creation.
   */
  async create(data: CreateApiKeyDTO): Promise<{ apiKey: IApiKey; rawKey: string }> {
    const { tenantId, userId } = RequestContext.get();

    // Check tenant limit
    const existingCount = await this.repo.countByTenant(tenantId);
    if (existingCount >= MAX_API_KEYS_PER_TENANT) {
      throw new BadRequestError(`Maximum of ${MAX_API_KEYS_PER_TENANT} API keys per tenant`);
    }

    // Generate random API key: tsk_ prefix + 32 random bytes in base64url
    const rawKey = `tsk_${crypto.randomBytes(32).toString('base64url')}`;
    const keyPrefix = rawKey.substring(0, 12); // tsk_ + 8 chars
    const keyHash = await bcrypt.hash(rawKey, SALT_ROUNDS);

    const apiKey = await this.repo.create({
      tenantId,
      name: data.name,
      keyHash,
      keyPrefix,
      permissions: data.permissions,
      expiresAt: data.expiresAt,
      rateLimit: data.rateLimit,
      createdBy: userId,
    });

    // Return raw key only once - won't be retrievable later
    return { apiKey, rawKey };
  }

  /**
   * Verify an API key and return the associated record if valid.
   * Used by middleware to authenticate API key requests.
   */
  async verify(rawKey: string): Promise<IApiKey | null> {
    if (!rawKey.startsWith('tsk_')) {
      return null;
    }

    const keyPrefix = rawKey.substring(0, 12);

    // Find candidates by prefix
    const candidates = await this.repo.findByPrefix(keyPrefix);

    for (const apiKey of candidates) {
      const isValid = await bcrypt.compare(rawKey, apiKey.keyHash);

      if (isValid) {
        // Check if active
        if (!apiKey.isActive) {
          return null;
        }

        // Check expiration
        if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
          return null;
        }

        return apiKey;
      }
    }

    return null;
  }

  /**
   * Check if an API key has a specific permission.
   */
  hasPermission(apiKey: IApiKey, requiredPermission: ApiKeyPermission): boolean {
    return apiKey.permissions.includes(requiredPermission);
  }

  /**
   * Record API key usage (called by middleware after successful auth).
   */
  async recordUsage(apiKeyId: string, clientIp?: string): Promise<void> {
    await this.repo.updateUsage(apiKeyId, {
      lastUsedAt: new Date(),
      lastUsedIp: clientIp,
    });
  }

  /**
   * List all API keys for the current tenant.
   */
  async list(): Promise<IApiKey[]> {
    const { tenantId } = RequestContext.get();
    return this.repo.findByTenant(tenantId);
  }

  /**
   * Get a single API key by ID.
   */
  async getById(apiKeyId: string): Promise<IApiKey> {
    const { tenantId } = RequestContext.get();

    const apiKey = await this.repo.findById(tenantId, apiKeyId);
    if (!apiKey) {
      throw new NotFoundError('API key');
    }

    return apiKey;
  }

  /**
   * Update an API key's metadata.
   */
  async update(apiKeyId: string, data: UpdateApiKeyDTO): Promise<IApiKey> {
    const { tenantId, role } = RequestContext.get();

    const existing = await this.repo.findById(tenantId, apiKeyId);
    if (!existing) {
      throw new NotFoundError('API key');
    }

    // Only admins/owners can modify API keys
    if (!['owner', 'admin'].includes(role)) {
      throw new ForbiddenError('Only admins can modify API keys');
    }

    const updated = await this.repo.update(tenantId, apiKeyId, data);
    if (!updated) {
      throw new NotFoundError('API key');
    }

    return updated;
  }

  /**
   * Revoke (deactivate) an API key.
   */
  async revoke(apiKeyId: string): Promise<void> {
    const { tenantId, role } = RequestContext.get();

    const apiKey = await this.repo.findById(tenantId, apiKeyId);
    if (!apiKey) {
      throw new NotFoundError('API key');
    }

    // Only admins/owners can revoke API keys
    if (!['owner', 'admin'].includes(role)) {
      throw new ForbiddenError('Only admins can revoke API keys');
    }

    await this.repo.update(tenantId, apiKeyId, { isActive: false });
  }

  /**
   * Permanently delete an API key.
   */
  async delete(apiKeyId: string): Promise<void> {
    const { tenantId, role } = RequestContext.get();

    const apiKey = await this.repo.findById(tenantId, apiKeyId);
    if (!apiKey) {
      throw new NotFoundError('API key');
    }

    // Only admins/owners can delete API keys
    if (!['owner', 'admin'].includes(role)) {
      throw new ForbiddenError('Only admins can delete API keys');
    }

    await this.repo.softDelete(tenantId, apiKeyId);
  }

  /**
   * Regenerate an API key's secret. Returns the new raw key.
   */
  async regenerate(apiKeyId: string): Promise<{ apiKey: IApiKey; rawKey: string }> {
    const { tenantId, role } = RequestContext.get();

    const existing = await this.repo.findById(tenantId, apiKeyId);
    if (!existing) {
      throw new NotFoundError('API key');
    }

    // Only admins/owners can regenerate API keys
    if (!['owner', 'admin'].includes(role)) {
      throw new ForbiddenError('Only admins can regenerate API keys');
    }

    // Generate new key
    const rawKey = `tsk_${crypto.randomBytes(32).toString('base64url')}`;
    const keyPrefix = rawKey.substring(0, 12);
    const keyHash = await bcrypt.hash(rawKey, SALT_ROUNDS);

    const updated = await this.repo.updateKeyHash(tenantId, apiKeyId, keyHash, keyPrefix);
    if (!updated) {
      throw new NotFoundError('API key');
    }

    return { apiKey: updated, rawKey };
  }
}
