import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../src/modules/auth/auth.service';
import { AuthRepository } from '../../src/modules/auth/auth.repository';
import { EventBus } from '../../src/core/events/EventBus';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../src/core/errors/AppError';
import { createTenant, createUser } from '../helpers/factories';
import { createMockRedis, clearMockRedis } from '../helpers/testRedis';

// Mock dependencies
jest.mock('../../src/modules/auth/auth.repository');
jest.mock('../../src/core/events/EventBus', () => ({
  EventBus: { emit: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../src/infrastructure/redis/client', () => ({
  getRedisClient: () => createMockRedis(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockRepo: jest.Mocked<AuthRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    clearMockRedis();

    authService = new AuthService();
    // Get the mocked instance
    mockRepo = (AuthRepository as jest.MockedClass<typeof AuthRepository>).mock
      .instances[0] as jest.Mocked<AuthRepository>;
  });

  describe('register', () => {
    const validInput = {
      orgName: 'Acme Inc',
      email: 'john@acme.com',
      password: 'SecurePassword123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should create tenant and user atomically on successful registration', async () => {
      const mockTenant = {
        ...createTenant({ name: validInput.orgName, slug: 'acme-inc' }),
        save: jest.fn().mockResolvedValue(undefined),
        deleteOne: jest.fn(),
      };
      const mockUser = createUser(mockTenant.tenantId as string, {
        email: validInput.email,
        firstName: validInput.firstName,
        lastName: validInput.lastName,
        role: 'owner',
      });

      mockRepo.findTenantBySlug = jest.fn().mockResolvedValue(null);
      mockRepo.createTenant = jest.fn().mockResolvedValue(mockTenant);
      mockRepo.createUser = jest.fn().mockResolvedValue({
        ...mockUser,
        id: mockUser._id?.toString(),
      });

      const result = await authService.register(validInput);

      expect(mockRepo.findTenantBySlug).toHaveBeenCalledWith('acme-inc');
      expect(mockRepo.createTenant).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Acme Inc',
          slug: 'acme-inc',
        })
      );
      expect(mockRepo.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: validInput.email,
          firstName: validInput.firstName,
          lastName: validInput.lastName,
          role: 'owner',
        })
      );
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.role).toBe('owner');
      expect(EventBus.emit).toHaveBeenCalledWith(
        'tenant.created',
        expect.objectContaining({ plan: 'free' })
      );
    });

    it('should reject registration when slug already exists', async () => {
      const existingTenant = createTenant({ slug: 'acme-inc' });
      mockRepo.findTenantBySlug = jest.fn().mockResolvedValue(existingTenant);

      await expect(authService.register(validInput)).rejects.toThrow(ConflictError);
      await expect(authService.register(validInput)).rejects.toThrow(
        'Organization slug "acme-inc" is already taken'
      );
    });

    it('should sanitize organization name to create slug', async () => {
      const mockTenant = {
        ...createTenant(),
        save: jest.fn().mockResolvedValue(undefined),
        deleteOne: jest.fn(),
      };
      const mockUser = {
        ...createUser(mockTenant.tenantId as string),
        id: 'user-123',
      };

      mockRepo.findTenantBySlug = jest.fn().mockResolvedValue(null);
      mockRepo.createTenant = jest.fn().mockResolvedValue(mockTenant);
      mockRepo.createUser = jest.fn().mockResolvedValue(mockUser);

      await authService.register({
        ...validInput,
        orgName: 'My Company!!! @#$ 123',
      });

      expect(mockRepo.findTenantBySlug).toHaveBeenCalledWith('my-company-123');
    });

    it('should rollback tenant creation if user creation fails', async () => {
      const mockTenant = {
        ...createTenant(),
        save: jest.fn(),
        deleteOne: jest.fn().mockResolvedValue(undefined),
      };

      mockRepo.findTenantBySlug = jest.fn().mockResolvedValue(null);
      mockRepo.createTenant = jest.fn().mockResolvedValue(mockTenant);
      mockRepo.createUser = jest.fn().mockRejectedValue(new Error('DB Error'));

      await expect(authService.register(validInput)).rejects.toThrow('DB Error');
      expect(mockTenant.deleteOne).toHaveBeenCalled();
    });

    it('should hash password before storing', async () => {
      const mockTenant = {
        ...createTenant(),
        save: jest.fn().mockResolvedValue(undefined),
        deleteOne: jest.fn(),
      };
      const mockUser = {
        ...createUser(mockTenant.tenantId as string),
        id: 'user-123',
      };

      mockRepo.findTenantBySlug = jest.fn().mockResolvedValue(null);
      mockRepo.createTenant = jest.fn().mockResolvedValue(mockTenant);
      mockRepo.createUser = jest.fn().mockResolvedValue(mockUser);

      await authService.register(validInput);

      const createUserCall = mockRepo.createUser.mock.calls[0][0];
      expect(createUserCall.passwordHash).not.toBe(validInput.password);
      expect(await bcrypt.compare(validInput.password, createUserCall.passwordHash)).toBe(true);
    });
  });

  describe('login', () => {
    const loginInput = {
      tenantSlug: 'acme-inc',
      email: 'john@acme.com',
      password: 'SecurePassword123!',
    };

    it('should return tokens for valid credentials', async () => {
      const mockTenant = createTenant({ slug: loginInput.tenantSlug });
      const passwordHash = await bcrypt.hash(loginInput.password, 10);
      const mockUser = {
        ...createUser(mockTenant.tenantId as string, {
          email: loginInput.email,
          role: 'member',
        }),
        id: 'user-123',
        passwordHash,
      };

      mockRepo.findTenantBySlug = jest.fn().mockResolvedValue(mockTenant);
      mockRepo.findUserByEmail = jest.fn().mockResolvedValue(mockUser);
      mockRepo.updateLastLogin = jest.fn().mockResolvedValue(undefined);

      const result = await authService.login(loginInput);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(loginInput.email);
      expect(mockRepo.updateLastLogin).toHaveBeenCalledWith('user-123');
    });

    it('should throw NotFoundError when tenant does not exist', async () => {
      mockRepo.findTenantBySlug = jest.fn().mockResolvedValue(null);

      await expect(authService.login(loginInput)).rejects.toThrow(NotFoundError);
      await expect(authService.login(loginInput)).rejects.toThrow('Organization');
    });

    it('should throw UnauthorizedError when user does not exist', async () => {
      const mockTenant = createTenant({ slug: loginInput.tenantSlug });
      mockRepo.findTenantBySlug = jest.fn().mockResolvedValue(mockTenant);
      mockRepo.findUserByEmail = jest.fn().mockResolvedValue(null);

      await expect(authService.login(loginInput)).rejects.toThrow(UnauthorizedError);
      await expect(authService.login(loginInput)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedError for invalid password', async () => {
      const mockTenant = createTenant({ slug: loginInput.tenantSlug });
      const mockUser = {
        ...createUser(mockTenant.tenantId as string),
        id: 'user-123',
        passwordHash: await bcrypt.hash('DifferentPassword', 10),
      };

      mockRepo.findTenantBySlug = jest.fn().mockResolvedValue(mockTenant);
      mockRepo.findUserByEmail = jest.fn().mockResolvedValue(mockUser);

      await expect(authService.login(loginInput)).rejects.toThrow(UnauthorizedError);
      await expect(authService.login(loginInput)).rejects.toThrow('Invalid credentials');
    });

    it('should include correct user data in response', async () => {
      const mockTenant = createTenant({ slug: loginInput.tenantSlug });
      const passwordHash = await bcrypt.hash(loginInput.password, 10);
      const mockUser = {
        ...createUser(mockTenant.tenantId as string, {
          email: loginInput.email,
          firstName: 'John',
          lastName: 'Doe',
          role: 'admin',
        }),
        id: 'user-456',
        passwordHash,
      };

      mockRepo.findTenantBySlug = jest.fn().mockResolvedValue(mockTenant);
      mockRepo.findUserByEmail = jest.fn().mockResolvedValue(mockUser);
      mockRepo.updateLastLogin = jest.fn().mockResolvedValue(undefined);

      const result = await authService.login(loginInput);

      expect(result.user).toEqual({
        _id: 'user-456',
        email: loginInput.email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'admin',
        tenantId: mockTenant.tenantId,
      });
    });
  });

  describe('refresh', () => {
    it('should return new tokens for valid refresh token', async () => {
      const userId = 'user-123';
      const tenantId = 'tenant-456';
      const refreshToken = jwt.sign(
        { userId, tenantId, tokenFamily: 'family-1' },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
      );

      // Store the refresh token in mock Redis
      const redis = createMockRedis();
      await redis.setex(`refresh:${userId}`, 604800, refreshToken);

      const mockUser = {
        ...createUser(tenantId),
        id: userId,
        role: 'member',
      };
      mockRepo.findUserById = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.refresh(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      // New refresh token should be different (rotation)
      expect(result.refreshToken).not.toBe(refreshToken);
    });

    it('should throw UnauthorizedError for invalid refresh token', async () => {
      const invalidToken = 'invalid.token.here';

      await expect(authService.refresh(invalidToken)).rejects.toThrow(UnauthorizedError);
      await expect(authService.refresh(invalidToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw UnauthorizedError and clear tokens on token reuse', async () => {
      const userId = 'user-123';
      const tenantId = 'tenant-456';
      const oldRefreshToken = jwt.sign(
        { userId, tenantId, tokenFamily: 'family-1' },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
      );

      // Store a different token in Redis (simulating reuse scenario)
      const redis = createMockRedis();
      await redis.setex(`refresh:${userId}`, 604800, 'different-token');

      await expect(authService.refresh(oldRefreshToken)).rejects.toThrow(UnauthorizedError);
      await expect(authService.refresh(oldRefreshToken)).rejects.toThrow(
        'Refresh token reuse detected'
      );

      // Token should be cleared from Redis
      const storedToken = await redis.get(`refresh:${userId}`);
      expect(storedToken).toBeNull();
    });

    it('should throw UnauthorizedError when user no longer exists', async () => {
      const userId = 'user-123';
      const tenantId = 'tenant-456';
      const refreshToken = jwt.sign(
        { userId, tenantId, tokenFamily: 'family-1' },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
      );

      const redis = createMockRedis();
      await redis.setex(`refresh:${userId}`, 604800, refreshToken);
      mockRepo.findUserById = jest.fn().mockResolvedValue(null);

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedError);
      await expect(authService.refresh(refreshToken)).rejects.toThrow('User not found');
    });
  });

  describe('logout', () => {
    it('should delete refresh token from Redis', async () => {
      const userId = 'user-123';
      const redis = createMockRedis();
      await redis.setex(`refresh:${userId}`, 604800, 'some-token');

      await authService.logout(userId);

      const storedToken = await redis.get(`refresh:${userId}`);
      expect(storedToken).toBeNull();
    });
  });

  describe('token generation', () => {
    it('should generate valid JWT access token with correct payload', async () => {
      const mockTenant = createTenant();
      const passwordHash = await bcrypt.hash('password123', 10);
      const mockUser = {
        ...createUser(mockTenant.tenantId as string, { role: 'admin' }),
        id: 'user-789',
        passwordHash,
      };

      mockRepo.findTenantBySlug = jest.fn().mockResolvedValue(mockTenant);
      mockRepo.findUserByEmail = jest.fn().mockResolvedValue(mockUser);
      mockRepo.updateLastLogin = jest.fn().mockResolvedValue(undefined);

      const result = await authService.login({
        tenantSlug: mockTenant.slug!,
        email: mockUser.email!,
        password: 'password123',
      });

      const decoded = jwt.verify(
        result.accessToken,
        process.env.JWT_ACCESS_SECRET!
      ) as Record<string, unknown>;

      expect(decoded.userId).toBe('user-789');
      expect(decoded.tenantId).toBe(mockTenant.tenantId);
      expect(decoded.role).toBe('admin');
      expect(decoded).toHaveProperty('exp');
      expect(decoded).toHaveProperty('iat');
    });
  });
});
