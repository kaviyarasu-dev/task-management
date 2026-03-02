import request from 'supertest';
import express from 'express';
import { Types } from 'mongoose';
import { createApp } from '../../src/app';
import { setupTestDb, teardownTestDb, clearTestDb } from '../helpers/testDb';
import { createMockRedis, clearMockRedis, resetMockRedis } from '../helpers/testRedis';
import { getAuthHeader } from '../helpers/authHelpers';
import { Tenant } from '../../src/modules/tenant/tenant.model';
import { User } from '../../src/modules/user/user.model';
import { Project } from '../../src/modules/project/project.model';
import { Status } from '../../src/modules/status/status.model';
import { Task } from '../../src/modules/task/task.model';
import bcrypt from 'bcryptjs';

// Mock Redis client before importing app
jest.mock('../../src/infrastructure/redis/client', () => ({
  getRedisClient: () => createMockRedis(),
}));

let app: express.Application;

describe('Task Routes Integration', () => {
  let tenantId: string;
  let userId: string;
  let projectId: string;
  let defaultStatusId: string;
  let doneStatusId: string;
  let authHeader: Record<string, string>;

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

    // Create test tenant
    const tenant = new Tenant({
      tenantId: 'test-tenant-123',
      name: 'Test Organization',
      slug: 'test-org',
      ownerId: 'temp-owner',
    });
    await tenant.save();
    tenantId = tenant.tenantId;

    // Create test user (owner role for all permissions)
    const passwordHash = await bcrypt.hash('TestPassword123', 10);
    const user = new User({
      tenantId,
      email: 'testuser@example.com',
      passwordHash,
      firstName: 'Test',
      lastName: 'User',
      role: 'owner',
    });
    await user.save();
    userId = user.id;

    // Update tenant owner
    tenant.ownerId = userId;
    await tenant.save();

    // Create test statuses
    const todoStatus = new Status({
      tenantId,
      name: 'To Do',
      slug: 'to-do',
      color: '#6B7280',
      icon: 'circle',
      category: 'open',
      order: 0,
      isDefault: true,
    });
    await todoStatus.save();
    defaultStatusId = todoStatus.id;

    const doneStatus = new Status({
      tenantId,
      name: 'Done',
      slug: 'done',
      color: '#10B981',
      icon: 'circle-check',
      category: 'closed',
      order: 2,
      isDefault: false,
    });
    await doneStatus.save();
    doneStatusId = doneStatus.id;

    // Create test project
    const project = new Project({
      tenantId,
      name: 'Test Project',
      description: 'A test project',
      ownerId: userId,
      memberIds: [userId],
    });
    await project.save();
    projectId = project.id;

    // Get auth header
    authHeader = getAuthHeader(userId, tenantId, 'owner');
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a new task successfully', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set(authHeader)
        .send({
          title: 'My New Task',
          description: 'Task description',
          projectId,
          priority: 'high',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('My New Task');
      expect(response.body.data.description).toBe('Task description');
      expect(response.body.data.priority).toBe('high');
      expect(response.body.data.projectId).toBe(projectId);
      expect(response.body.data.reporterId).toBe(userId);
      expect(response.body.data.tenantId).toBe(tenantId);
    });

    it('should create task with explicit status', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set(authHeader)
        .send({
          title: 'Task with status',
          projectId,
          status: doneStatusId,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.status.toString()).toBe(doneStatusId);
    });

    it('should create task with due date', async () => {
      const dueDate = '2025-12-31';
      const response = await request(app)
        .post('/api/v1/tasks')
        .set(authHeader)
        .send({
          title: 'Task with due date',
          projectId,
          dueDate,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.dueDate).toContain('2025-12-31');
    });

    it('should create task with tags', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set(authHeader)
        .send({
          title: 'Task with tags',
          projectId,
          tags: ['frontend', 'urgent'],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.tags).toEqual(['frontend', 'urgent']);
    });

    it('should reject task without title', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set(authHeader)
        .send({
          projectId,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject task without projectId', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set(authHeader)
        .send({
          title: 'Task without project',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject task with invalid priority', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set(authHeader)
        .send({
          title: 'Task with invalid priority',
          projectId,
          priority: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .send({
          title: 'Unauthenticated task',
          projectId,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/tasks', () => {
    beforeEach(async () => {
      // Create some test tasks
      for (let i = 0; i < 15; i++) {
        await new Task({
          tenantId,
          title: `Task ${i + 1}`,
          projectId,
          reporterId: userId,
          status: new Types.ObjectId(defaultStatusId),
          priority: i % 2 === 0 ? 'high' : 'low',
        }).save();
      }
    });

    it('should list tasks with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?limit=10')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(10);
      expect(response.body).toHaveProperty('nextCursor');
    });

    it('should filter tasks by project', async () => {
      // Create a task in a different project
      const otherProject = new Project({
        tenantId,
        name: 'Other Project',
        ownerId: userId,
        memberIds: [userId],
      });
      await otherProject.save();

      await new Task({
        tenantId,
        title: 'Other Project Task',
        projectId: otherProject.id,
        reporterId: userId,
        status: new Types.ObjectId(defaultStatusId),
      }).save();

      const response = await request(app)
        .get(`/api/v1/tasks?projectId=${projectId}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.every((t: { projectId: string }) => t.projectId === projectId)).toBe(true);
    });

    it('should filter tasks by priority', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?priority=high')
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data.every((t: { priority: string }) => t.priority === 'high')).toBe(true);
    });

    it('should filter tasks by status', async () => {
      // Create a done task
      await new Task({
        tenantId,
        title: 'Done Task',
        projectId,
        reporterId: userId,
        status: new Types.ObjectId(doneStatusId),
      }).save();

      const response = await request(app)
        .get(`/api/v1/tasks?status=${doneStatusId}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Done Task');
    });

    it('should support cursor-based pagination', async () => {
      // Get first page
      const page1 = await request(app)
        .get('/api/v1/tasks?limit=5')
        .set(authHeader);

      expect(page1.status).toBe(200);
      expect(page1.body.data).toHaveLength(5);
      expect(page1.body.nextCursor).toBeDefined();

      // Get second page
      const page2 = await request(app)
        .get(`/api/v1/tasks?limit=5&cursor=${page1.body.nextCursor}`)
        .set(authHeader);

      expect(page2.status).toBe(200);
      expect(page2.body.data).toHaveLength(5);
      // Tasks should be different
      expect(page2.body.data[0]._id).not.toBe(page1.body.data[0]._id);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/tasks');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const task = new Task({
        tenantId,
        title: 'Single Task',
        description: 'Task for getById test',
        projectId,
        reporterId: userId,
        status: new Types.ObjectId(defaultStatusId),
        priority: 'medium',
        tags: ['test'],
      });
      await task.save();
      taskId = task.id;
    });

    it('should get task by id', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Single Task');
      expect(response.body.data.description).toBe('Task for getById test');
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new Types.ObjectId().toString();
      const response = await request(app)
        .get(`/api/v1/tasks/${fakeId}`)
        .set(authHeader);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid task id format', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/invalid-id')
        .set(authHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const task = new Task({
        tenantId,
        title: 'Original Title',
        projectId,
        reporterId: userId,
        status: new Types.ObjectId(defaultStatusId),
        priority: 'low',
      });
      await task.save();
      taskId = task.id;
    });

    it('should update task title', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set(authHeader)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
    });

    it('should update task status', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set(authHeader)
        .send({ status: doneStatusId });

      expect(response.status).toBe(200);
      expect(response.body.data.status.toString()).toBe(doneStatusId);
    });

    it('should update task priority', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set(authHeader)
        .send({ priority: 'urgent' });

      expect(response.status).toBe(200);
      expect(response.body.data.priority).toBe('urgent');
    });

    it('should update multiple fields at once', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set(authHeader)
        .send({
          title: 'Multi Update',
          priority: 'high',
          tags: ['updated', 'multi'],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Multi Update');
      expect(response.body.data.priority).toBe('high');
      expect(response.body.data.tags).toEqual(['updated', 'multi']);
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new Types.ObjectId().toString();
      const response = await request(app)
        .patch(`/api/v1/tasks/${fakeId}`)
        .set(authHeader)
        .send({ title: 'Updated' });

      expect(response.status).toBe(404);
    });

    it('should reject invalid priority value', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set(authHeader)
        .send({ priority: 'invalid' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const task = new Task({
        tenantId,
        title: 'Task to Delete',
        projectId,
        reporterId: userId,
        status: new Types.ObjectId(defaultStatusId),
      });
      await task.save();
      taskId = task.id;
    });

    it('should soft delete task', async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task deleted');

      // Verify task is soft deleted (has deletedAt)
      const deletedTask = await Task.findById(taskId);
      expect(deletedTask?.deletedAt).toBeDefined();
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new Types.ObjectId().toString();
      const response = await request(app)
        .delete(`/api/v1/tasks/${fakeId}`)
        .set(authHeader);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid task id', async () => {
      const response = await request(app)
        .delete('/api/v1/tasks/invalid-id')
        .set(authHeader);

      expect(response.status).toBe(400);
    });
  });

  describe('Role-based access control', () => {
    it('should allow member role to read tasks', async () => {
      const memberHeader = getAuthHeader(userId, tenantId, 'member');

      const response = await request(app)
        .get('/api/v1/tasks')
        .set(memberHeader);

      expect(response.status).toBe(200);
    });

    it('should allow member role to create tasks', async () => {
      const memberHeader = getAuthHeader(userId, tenantId, 'member');

      const response = await request(app)
        .post('/api/v1/tasks')
        .set(memberHeader)
        .send({
          title: 'Member Task',
          projectId,
        });

      expect(response.status).toBe(201);
    });

    it('should allow viewer role to read tasks', async () => {
      const viewerHeader = getAuthHeader(userId, tenantId, 'viewer');

      const response = await request(app)
        .get('/api/v1/tasks')
        .set(viewerHeader);

      // Viewers should have tasks:read permission
      expect(response.status).toBe(200);
    });
  });
});
