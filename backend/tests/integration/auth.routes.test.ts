import request from 'supertest';
import express from 'express';
import { createApp } from '../../src/app';
import { setupTestDb, teardownTestDb, clearTestDb } from '../helpers/testDb';
import { createMockRedis, clearMockRedis, resetMockRedis } from '../helpers/testRedis';
import { getAuthHeader } from '../helpers/authHelpers';
import { Tenant } from '../../src/modules/tenant/tenant.model';
import { User } from '../../src/modules/user/user.model';
import bcrypt from 'bcryptjs';

// Mock Redis client before importing app
jest.mock('../../src/infrastructure/redis/client', () => ({
  getRedisClient: () => createMockRedis(),
}));

let app: express.Application;

describe('Auth Routes Integration', () => {
  beforeAll(async () => {
    await setupTestDb();
    app = await createApp();
  });

  afterAll(async () => {
    resetMockRedis();
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await clearMockRedis();
  });

  describe('POST /api/v1/auth/register', () => {
    const validRegistration = {
      email: 'john@example.com',
      password: 'SecurePass123',
      firstName: 'John',
      lastName: 'Doe',
      orgName: 'Acme Inc',
    };

    it('should register new organization and user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validRegistration);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toMatchObject({
        email: validRegistration.email,
        firstName: validRegistration.firstName,
        lastName: validRegistration.lastName,
        role: 'owner',
      });

      // Verify tenant was created
      const tenant = await Tenant.findOne({ slug: 'acme-inc' });
      expect(tenant).not.toBeNull();
      expect(tenant?.name).toBe('Acme Inc');

      // Verify user was created
      const user = await User.findOne({ email: validRegistration.email });
      expect(user).not.toBeNull();
      expect(user?.role).toBe('owner');
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validRegistration, email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validRegistration, password: 'weak' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with password missing uppercase', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validRegistration, password: 'lowercase123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with password missing number', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validRegistration, password: 'NoNumbers' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@test.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate organization slug', async () => {
      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send(validRegistration);

      // Second registration with same org name
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validRegistration,
          email: 'another@example.com',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const testUser = {
      email: 'testuser@example.com',
      password: 'TestPassword123',
      firstName: 'Test',
      lastName: 'User',
    };
    let tenantSlug: string;

    beforeEach(async () => {
      // Create a tenant and user for login tests
      const tenant = new Tenant({
        tenantId: 'test-tenant-id',
        name: 'Test Org',
        slug: 'test-org',
        ownerId: 'temp-owner',
      });
      await tenant.save();
      tenantSlug = tenant.slug;

      const passwordHash = await bcrypt.hash(testUser.password, 10);
      const user = new User({
        tenantId: tenant.tenantId,
        email: testUser.email,
        passwordHash,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: 'owner',
      });
      await user.save();

      tenant.ownerId = user.id;
      await tenant.save();
    });

    it('should return tokens for valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          tenantSlug,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123',
          tenantSlug,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
          tenantSlug,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject login with non-existent tenant', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          tenantSlug: 'nonexistent-org',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should update last login timestamp', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          tenantSlug,
        });

      const user = await User.findOne({ email: testUser.email });
      expect(user?.lastLoginAt).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return new tokens for valid refresh token', async () => {
      // First register to get tokens
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'refresh@example.com',
          password: 'SecurePass123',
          firstName: 'Refresh',
          lastName: 'Test',
          orgName: 'Refresh Org',
        });

      const { refreshToken } = registerRes.body.data;

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      // New refresh token should be different (rotation)
      expect(response.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      // First register to get tokens
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'logout@example.com',
          password: 'SecurePass123',
          firstName: 'Logout',
          lastName: 'Test',
          orgName: 'Logout Org',
        });

      const { accessToken } = registerRes.body.data;

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out');
    });

    it('should reject logout without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user info', async () => {
      // First register to get tokens
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'me@example.com',
          password: 'SecurePass123',
          firstName: 'Me',
          lastName: 'Test',
          orgName: 'Me Org',
        });

      const { accessToken } = registerRes.body.data;

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        email: 'me@example.com',
        role: 'owner',
      });
    });

    it('should reject without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
    });

    it('should reject with expired token', async () => {
      // Create an expired token for testing
      const { generateExpiredToken } = await import('../helpers/authHelpers');
      const expiredToken = generateExpiredToken({
        userId: 'user-123',
        tenantId: 'tenant-123',
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });
  });
});
