import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';
import { createRequire } from 'node:module';
const { captures } = createRequire(import.meta.url)('../src/services/accountEmail.js');
import prisma from '../src/config/prisma.js';

describe('Get It Done Comprehensive API Test Suite', () => {
  let adminToken = '';
  let posterToken = '';
  let taskerToken = '';
  let testTaskId = '';
  let testOfferId = '';

  beforeAll(async () => {
    // Authenticate seeded users
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@getitdone.com', password: 'Password123!' });
    adminToken = adminRes.body.token;

    const posterRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah@example.com', password: 'Password123!' });
    posterToken = posterRes.body.token;

    const taskerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alex@example.com', password: 'Password123!' });
    taskerToken = taskerRes.body.token;
  });

  // 1. Health & Security Headers
  describe('System Health & Security Headers', () => {
    it('GET /api/health should return minimal 200 OK without leaking database or uptime diagnostics', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database).toBeUndefined();
      expect(res.body.uptime).toBeUndefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });
  });

  // 2. Auth & Validation Layer
  describe('Authentication & Zod Validation', () => {
    it('POST /api/auth/register should reject invalid emails with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Bob', email: 'invalid-email', password: 'Password123!' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('POST /api/auth/register should reject short passwords (< 6 chars)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Bob Smith', email: 'bob.new@example.com', password: '123' });
      expect(res.status).toBe(400);
    });

    it('POST /api/auth/register creates a pending account requiring activation', async () => {
      const uniqueEmail = `testuser_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: uniqueEmail, password: 'Password123!' });
      expect(res.status).toBe(201);
      expect(res.body.token).toBeUndefined();
      expect(res.body.requiresVerification).toBe(true);
      const mail = captures.find((m) => m.to === uniqueEmail);
      expect(
        (await request(app).post('/api/auth/verify-email').send({ token: mail.token })).status,
      ).toBe(200);
    });

    it('POST /api/auth/login returns 401 on incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'sarah@example.com', password: 'WrongPassword!' });
      expect(res.status).toBe(401);
    });

    it('GET /api/auth/me returns 401 without Bearer token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('GET /api/auth/me returns profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${posterToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('sarah@example.com');
    });

    it('POST /api/auth/logout clears getitdone_token and taskconnect_token cookies', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Logged out successfully');
      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      expect(setCookie.some((c) => c.includes('getitdone_token=;'))).toBe(true);
      expect(setCookie.some((c) => c.includes('taskconnect_token=;'))).toBe(true);
    });
  });

  // 3. Task & Bidding Lifecycle
  describe('Task, Offer & Escrow Workflow', () => {
    it('GET /api/tasks returns public task listings', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.tasks)).toBe(true);
      expect(res.body.tasks.length).toBeGreaterThan(0);
    });

    it('POST /api/tasks creates task when authorized and valid', async () => {
      const categories = await prisma.category.findMany();
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${posterToken}`)
        .send({
          title: 'Mount Floating Shelves in Living Room',
          description:
            'Need two 4-foot solid oak floating shelves mounted securely into brick wall studs.',
          budget: 95,
          categoryId: categories[0].id,
          isRemote: false,
          location: 'SoHo, New York, NY',
          latitude: 40.723,
          longitude: -74.003,
        });

      expect(res.status).toBe(201);
      expect(res.body.task.title).toContain('Floating Shelves');
      testTaskId = res.body.task.id;
      expect(res.body.task.status).toBe('DRAFT');
      expect(
        (
          await request(app)
            .post('/api/payments/tasks/' + testTaskId + '/fund')
            .set('Authorization', 'Bearer ' + posterToken)
            .send({ confirmPreview: true })
        ).status,
      ).toBe(200);
    });

    it('GET /api/tasks/:id fuzzes coordinates for public unassigned viewers', async () => {
      const res = await request(app).get(`/api/tasks/${testTaskId}`);
      expect(res.status).toBe(200);
      expect(res.body.task.latitude).toBe(40.72);
      expect(res.body.task.longitude).toBe(-74);
    });

    it('GET /api/tasks/:id reveals exact coordinates for the task poster', async () => {
      const res = await request(app)
        .get(`/api/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${posterToken}`);
      expect(res.status).toBe(200);
      expect(res.body.task.latitude).toBe(40.723);
      expect(res.body.task.longitude).toBe(-74.003);
    });

    it('POST /api/offers/task/:id allows tasker to submit a quote', async () => {
      const res = await request(app)
        .post(`/api/offers/task/${testTaskId}`)
        .set('Authorization', `Bearer ${taskerToken}`)
        .send({
          amount: 90,
          message: 'I have concrete wall plugs, masonry bits, and a digital spirit level ready.',
        });

      expect(res.status).toBe(201);
      expect(res.body.offer.amount).toBe(90);
      testOfferId = res.body.offer.id;
    });

    it('POST /api/offers/:id/accept transitions task to ASSIGNED and locks escrow', async () => {
      const res = await request(app)
        .post(`/api/offers/${testOfferId}/accept`)
        .set('Authorization', `Bearer ${posterToken}`)
        .send({ confirmPreview: true });

      expect(res.status).toBe(200);
      expect(res.body.escrowPayment.status).toBe('HELD_IN_ESCROW');
      expect(res.body.escrowPayment.amount).toBe(90);
    });

    it('PATCH /api/tasks/:id/complete releases funds only after tasker delivery', async () => {
      expect(
        (
          await request(app)
            .post('/api/payments/tasks/' + testTaskId + '/deliver')
            .set('Authorization', 'Bearer ' + taskerToken)
            .send({ notes: 'Shelves mounted and installation inspected.' })
        ).status,
      ).toBe(200);
      const res = await request(app)
        .patch(`/api/tasks/${testTaskId}/complete`)
        .set('Authorization', `Bearer ${posterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('payment released');
      expect(res.body.payoutAmount).toBe(85.44); // $90 minus $1 and 4% of $89
    });

    it('POST /api/reviews/task/:id submits review and updates rating stats', async () => {
      const res = await request(app)
        .post(`/api/reviews/task/${testTaskId}`)
        .set('Authorization', `Bearer ${posterToken}`)
        .send({
          rating: 5,
          comment: 'Perfect mounting! Dead level and super clean work.',
        });

      expect(res.status).toBe(201);
      expect(res.body.review.rating).toBe(5);
    });
  });

  // 4. Role-Based Access Control (RBAC)
  describe('Authorization & Admin Guard', () => {
    it('GET /api/admin/stats returns 403 Forbidden for regular users', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${posterToken}`);
      expect(res.status).toBe(403);
    });

    it('GET /api/admin/stats returns 200 OK for Admin', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.stats.totalUsers).toBeGreaterThan(0);
      expect(res.body.stats.totalTasks).toBeGreaterThan(0);
    });

    it('GET /api/admin/health returns 403 Forbidden for non-admin users', async () => {
      const res = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${posterToken}`);
      expect(res.status).toBe(403);
    });

    it('GET /api/admin/health returns 200 OK with detailed diagnostics for Admin', async () => {
      const res = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database).toBe('healthy');
      expect(res.body.uptime).toBeDefined();
      expect(res.body.version).toBeDefined();
    });
  });

  describe('Customer Support & Contact Inquiries', () => {
    it('POST /api/contact rejects invalid contact payload', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({ email: 'not-an-email', message: 'Hi' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('POST /api/contact accepts valid inquiry and dispatches to support', async () => {
      const res = await request(app).post('/api/contact').send({
        name: 'Business Partner',
        email: 'partner@example.com',
        subject: 'Commercial Partnership Inquiry',
        category: 'Partnership',
        message: 'We are interested in integrating our corporate services with Get It Done.',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('received');
    });
  });
});
