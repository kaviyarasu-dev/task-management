import request from 'supertest';
import express from 'express';
import { createApp } from '../../src/app';
import { setupTestDb, teardownTestDb, clearTestDb } from '../helpers/testDb';
import { createMockRedis, clearMockRedis, resetMockRedis } from '../helpers/testRedis';

// Mock Redis client
jest.mock('../../src/infrastructure/redis/client', () => ({
  getRedisClient: () => createMockRedis(),
}));

let app: express.Application;

describe('E2E: Registration to Task Completion', () => {
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

  it('should complete full user journey from registration to task completion', async () => {
    // ============================================
    // Step 1: Register a new organization and user
    // ============================================
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'jane@mycompany.com',
        password: 'SecurePass123',
        firstName: 'Jane',
        lastName: 'Doe',
        orgName: 'My Company',
      });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);

    const { accessToken, user } = registerRes.body.data;
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    expect(user.email).toBe('jane@mycompany.com');
    expect(user.role).toBe('owner');

    // ============================================
    // Step 2: Create a project
    // ============================================
    const projectRes = await request(app)
      .post('/api/v1/projects')
      .set(authHeader)
      .send({
        name: 'Q1 Goals',
        description: 'First quarter objectives and key results',
      });

    expect(projectRes.status).toBe(201);
    const projectId = projectRes.body.data._id;

    // ============================================
    // Step 3: Get available statuses for the tenant
    // ============================================
    const statusRes = await request(app)
      .get('/api/v1/status')
      .set(authHeader);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.length).toBeGreaterThan(0);

    const statuses = statusRes.body.data;
    const todoStatus = statuses.find((s: { category: string }) => s.category === 'open');
    const doneStatus = statuses.find((s: { category: string }) => s.category === 'closed');

    expect(todoStatus).toBeDefined();
    expect(doneStatus).toBeDefined();

    // ============================================
    // Step 4: Create a task
    // ============================================
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const taskRes = await request(app)
      .post('/api/v1/tasks')
      .set(authHeader)
      .send({
        title: 'Complete quarterly roadmap',
        description: 'Define and document the product roadmap for Q1',
        projectId,
        status: todoStatus._id,
        priority: 'high',
        dueDate: dueDate.toISOString().split('T')[0], // YYYY-MM-DD format
        tags: ['planning', 'roadmap'],
      });

    expect(taskRes.status).toBe(201);
    expect(taskRes.body.data.title).toBe('Complete quarterly roadmap');
    expect(taskRes.body.data.priority).toBe('high');

    const taskId = taskRes.body.data._id;

    // ============================================
    // Step 5: Verify task appears in task list
    // ============================================
    const listRes = await request(app)
      .get(`/api/v1/tasks?projectId=${projectId}`)
      .set(authHeader);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0]._id).toBe(taskId);

    // ============================================
    // Step 6: Update task to mark as done
    // ============================================
    const updateRes = await request(app)
      .patch(`/api/v1/tasks/${taskId}`)
      .set(authHeader)
      .send({
        status: doneStatus._id,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status.toString()).toBe(doneStatus._id);

    // ============================================
    // Step 7: Verify task status in filtered list
    // ============================================
    const doneListRes = await request(app)
      .get(`/api/v1/tasks?status=${doneStatus._id}`)
      .set(authHeader);

    expect(doneListRes.status).toBe(200);
    expect(doneListRes.body.data).toHaveLength(1);
    expect(doneListRes.body.data[0]._id).toBe(taskId);

    // ============================================
    // Step 8: Verify user info endpoint works
    // ============================================
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set(authHeader);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('jane@mycompany.com');
  });

  it('should handle the team invitation and collaboration flow', async () => {
    // ============================================
    // Step 1: Owner registers and creates organization
    // ============================================
    const ownerRegisterRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'owner@teamcompany.com',
        password: 'OwnerPass123',
        firstName: 'Team',
        lastName: 'Owner',
        orgName: 'Team Company',
      });

    expect(ownerRegisterRes.status).toBe(201);
    const ownerToken = ownerRegisterRes.body.data.accessToken;
    const ownerHeader = { Authorization: `Bearer ${ownerToken}` };

    // ============================================
    // Step 2: Owner creates a project
    // ============================================
    const projectRes = await request(app)
      .post('/api/v1/projects')
      .set(ownerHeader)
      .send({
        name: 'Team Project',
        description: 'A collaborative project',
      });

    expect(projectRes.status).toBe(201);
    const projectId = projectRes.body.data._id;

    // ============================================
    // Step 3: Owner invites a team member
    // ============================================
    const inviteRes = await request(app)
      .post('/api/v1/invitations')
      .set(ownerHeader)
      .send({
        email: 'member@teamcompany.com',
        role: 'member',
      });

    expect(inviteRes.status).toBe(201);
    const invitationToken = inviteRes.body.data.token;

    // ============================================
    // Step 4: Verify invitation
    // ============================================
    const verifyRes = await request(app)
      .get(`/api/v1/invitations/verify/${invitationToken}`);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.isValid).toBe(true);
    expect(verifyRes.body.data.tenantName).toBe('Team Company');

    // ============================================
    // Step 5: Member accepts invitation
    // ============================================
    const acceptRes = await request(app)
      .post('/api/v1/invitations/accept')
      .send({
        token: invitationToken,
        firstName: 'Team',
        lastName: 'Member',
        password: 'MemberPass123',
      });

    expect(acceptRes.status).toBe(201);
    expect(acceptRes.body.data.tenantSlug).toBe('team-company');

    // ============================================
    // Step 6: Member logs in
    // ============================================
    const memberLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'member@teamcompany.com',
        password: 'MemberPass123',
        tenantSlug: 'team-company',
      });

    expect(memberLoginRes.status).toBe(200);
    const memberToken = memberLoginRes.body.data.accessToken;
    const memberHeader = { Authorization: `Bearer ${memberToken}` };

    // ============================================
    // Step 7: Member creates a task in the project
    // ============================================
    const statusRes = await request(app)
      .get('/api/v1/status')
      .set(memberHeader);

    const todoStatus = statusRes.body.data.find((s: { isDefault: boolean }) => s.isDefault);

    const memberTaskRes = await request(app)
      .post('/api/v1/tasks')
      .set(memberHeader)
      .send({
        title: 'Member assigned task',
        projectId,
        status: todoStatus._id,
        priority: 'medium',
      });

    expect(memberTaskRes.status).toBe(201);

    // ============================================
    // Step 8: Owner can see member's task
    // ============================================
    const ownerListRes = await request(app)
      .get(`/api/v1/tasks?projectId=${projectId}`)
      .set(ownerHeader);

    expect(ownerListRes.status).toBe(200);
    expect(ownerListRes.body.data.some(
      (t: { title: string }) => t.title === 'Member assigned task'
    )).toBe(true);
  });

  it('should handle token refresh flow correctly', async () => {
    // ============================================
    // Step 1: Register user
    // ============================================
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'refresh@test.com',
        password: 'RefreshPass123',
        firstName: 'Refresh',
        lastName: 'Test',
        orgName: 'Refresh Org',
      });

    expect(registerRes.status).toBe(201);
    const { accessToken, refreshToken } = registerRes.body.data;

    // ============================================
    // Step 2: Use access token
    // ============================================
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set({ Authorization: `Bearer ${accessToken}` });

    expect(meRes.status).toBe(200);

    // ============================================
    // Step 3: Refresh tokens
    // ============================================
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    const newAccessToken = refreshRes.body.data.accessToken;
    const newRefreshToken = refreshRes.body.data.refreshToken;

    // New tokens should be different
    expect(newAccessToken).not.toBe(accessToken);
    expect(newRefreshToken).not.toBe(refreshToken);

    // ============================================
    // Step 4: Old refresh token should be invalid (rotation)
    // ============================================
    const replayRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(replayRes.status).toBe(401);
    expect(replayRes.body.message).toContain('reuse');

    // ============================================
    // Step 5: New access token should work
    // ============================================
    const newMeRes = await request(app)
      .get('/api/v1/auth/me')
      .set({ Authorization: `Bearer ${newAccessToken}` });

    expect(newMeRes.status).toBe(200);
  });

  it('should handle logout and session invalidation', async () => {
    // ============================================
    // Step 1: Register user
    // ============================================
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'logout@test.com',
        password: 'LogoutPass123',
        firstName: 'Logout',
        lastName: 'Test',
        orgName: 'Logout Org',
      });

    expect(registerRes.status).toBe(201);
    const { accessToken, refreshToken } = registerRes.body.data;
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // ============================================
    // Step 2: Verify token works
    // ============================================
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set(authHeader);

    expect(meRes.status).toBe(200);

    // ============================================
    // Step 3: Logout
    // ============================================
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set(authHeader);

    expect(logoutRes.status).toBe(200);

    // ============================================
    // Step 4: Refresh token should no longer work
    // ============================================
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(401);

    // Note: Access token might still work until expiry
    // This is by design in JWT-based systems
  });

  it('should handle project management lifecycle', async () => {
    // ============================================
    // Step 1: Register user
    // ============================================
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'project@test.com',
        password: 'ProjectPass123',
        firstName: 'Project',
        lastName: 'Manager',
        orgName: 'Project Org',
      });

    const authHeader = { Authorization: `Bearer ${registerRes.body.data.accessToken}` };

    // ============================================
    // Step 2: Create multiple projects
    // ============================================
    const project1 = await request(app)
      .post('/api/v1/projects')
      .set(authHeader)
      .send({ name: 'Project Alpha', description: 'First project' });

    const project2 = await request(app)
      .post('/api/v1/projects')
      .set(authHeader)
      .send({ name: 'Project Beta', description: 'Second project' });

    expect(project1.status).toBe(201);
    expect(project2.status).toBe(201);

    // ============================================
    // Step 3: List projects
    // ============================================
    const listRes = await request(app)
      .get('/api/v1/projects')
      .set(authHeader);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(2);

    // ============================================
    // Step 4: Create tasks in different projects
    // ============================================
    const statusRes = await request(app)
      .get('/api/v1/status')
      .set(authHeader);
    const defaultStatus = statusRes.body.data.find((s: { isDefault: boolean }) => s.isDefault);

    await request(app)
      .post('/api/v1/tasks')
      .set(authHeader)
      .send({
        title: 'Alpha Task 1',
        projectId: project1.body.data._id,
        status: defaultStatus._id,
      });

    await request(app)
      .post('/api/v1/tasks')
      .set(authHeader)
      .send({
        title: 'Alpha Task 2',
        projectId: project1.body.data._id,
        status: defaultStatus._id,
      });

    await request(app)
      .post('/api/v1/tasks')
      .set(authHeader)
      .send({
        title: 'Beta Task 1',
        projectId: project2.body.data._id,
        status: defaultStatus._id,
      });

    // ============================================
    // Step 5: Filter tasks by project
    // ============================================
    const alphaTasksRes = await request(app)
      .get(`/api/v1/tasks?projectId=${project1.body.data._id}`)
      .set(authHeader);

    expect(alphaTasksRes.status).toBe(200);
    expect(alphaTasksRes.body.data).toHaveLength(2);
    expect(alphaTasksRes.body.data.every(
      (t: { title: string }) => t.title.includes('Alpha')
    )).toBe(true);

    const betaTasksRes = await request(app)
      .get(`/api/v1/tasks?projectId=${project2.body.data._id}`)
      .set(authHeader);

    expect(betaTasksRes.status).toBe(200);
    expect(betaTasksRes.body.data).toHaveLength(1);
    expect(betaTasksRes.body.data[0].title).toBe('Beta Task 1');
  });
});
