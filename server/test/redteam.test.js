import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';
import prisma from '../src/config/prisma.js';

describe('Red Team Offensive Security Battery', () => {
  let adminToken = '';
  let posterToken = '';
  let taskerToken = '';
  let targetTaskId = '';
  let targetOfferId = '';

  beforeAll(async () => {
    // 1. Authenticate users
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@taskconnect.com', password: 'Password123!' });
    adminToken = adminRes.body.token;

    const posterRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah@example.com', password: 'Password123!' });
    posterToken = posterRes.body.token;

    const taskerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alex@example.com', password: 'Password123!' });
    taskerToken = taskerRes.body.token;

    // 2. Locate or create a target task owned by Poster (Sarah)
    const task = await prisma.task.findFirst({
      where: { posterId: posterRes.body.user.id, status: 'OPEN' },
    });
    if (task) {
      targetTaskId = task.id;
    } else {
      const categories = await prisma.category.findMany();
      const created = await prisma.task.create({
        data: {
          title: 'Target Task for Security Testing',
          description: 'Test description for penetration testing',
          budget: 100,
          status: 'OPEN',
          posterId: posterRes.body.user.id,
          categoryId: categories[0].id,
        },
      });
      targetTaskId = created.id;
    }

    // 3. Create an offer on this task from Tasker (Alex)
    const offer = await prisma.offer.create({
      data: {
        taskId: targetTaskId,
        taskerId: taskerRes.body.user.id,
        amount: 95,
        message: 'Security test proposal message',
        status: 'PENDING',
      },
    });
    targetOfferId = offer.id;
  });

  // TEST 1: SQL Injection Attack
  describe('ATTACK VECTOR 1: SQL / NoSQL Injection', () => {
    it('Rejects classic SQL injection strings in login payload', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: "' OR '1'='1' --",
          password: "password' OR '1'='1",
        });
      // Rejected by Zod email schema with 400 or fails auth with 401
      expect([400, 401]).toContain(res.status);
      expect(res.body.token).toBeUndefined();
    });

    it('Safely parameterizes SQL injection strings in task keyword search', async () => {
      const sqliPayload = "'; DROP TABLE \"Task\"; --";
      const res = await request(app)
        .get(`/api/tasks?search=${encodeURIComponent(sqliPayload)}`);
      expect(res.status).toBe(200);
      // Table must still exist and return empty or normal results without throwing SQL errors
      expect(Array.isArray(res.body.tasks)).toBe(true);
    });
  });

  // TEST 2: Stored Cross-Site Scripting (XSS)
  describe('ATTACK VECTOR 2: Cross-Site Scripting (XSS)', () => {
    it('Stores XSS payloads safely as plain text without execution side-effects', async () => {
      const xssPayload = '<script>alert(document.cookie)</script><img src=x onerror=alert(1)>';
      const categories = await prisma.category.findMany();

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${posterToken}`)
        .send({
          title: 'XSS Sanitization Test Task',
          description: `Testing XSS handling: ${xssPayload}`,
          budget: 80,
          categoryId: categories[0].id,
          isRemote: true,
        });

      expect(res.status).toBe(201);
      // Ensure the text is stored as literal string and does not break JSON serialization
      expect(res.body.task.description).toContain('<script>');
    });
  });

  // TEST 3: Broken Authentication & JWT Tampering
  describe('ATTACK VECTOR 3: JWT Tampering & Forgery', () => {
    it('Rejects modified JWT signature', async () => {
      const parts = posterToken.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.invalidsignature12345`;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('failed');
    });

    it('Rejects None-algorithm or unsigned JWT', async () => {
      const parts = posterToken.split('.');
      const noneToken = `${parts[0]}.${parts[1]}.`;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${noneToken}`);

      expect(res.status).toBe(401);
    });
  });

  // TEST 4: IDOR / Broken Access Control (Horizontal Privilege Escalation)
  describe('ATTACK VECTOR 4: Insecure Direct Object References (IDOR)', () => {
    it('Prevents unauthorized user from accepting someone else task offer', async () => {
      // Tasker (Alex) attempts to accept Sarah's task offer
      const res = await request(app)
        .post(`/api/offers/${targetOfferId}/accept`)
        .set('Authorization', `Bearer ${taskerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Only the task poster can accept');
    });

    it('Prevents unauthorized user from completing someone else task', async () => {
      // Tasker (Alex) attempts to trigger completion on an unassigned or another user task
      const res = await request(app)
        .patch(`/api/tasks/${targetTaskId}/complete`)
        .set('Authorization', `Bearer ${taskerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Only the poster or an administrator');
    });

    it('Prevents unauthorized user from deleting another user task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${targetTaskId}`)
        .set('Authorization', `Bearer ${taskerToken}`);

      expect(res.status).toBe(403);
    });
  });

  // TEST 5: Vertical Privilege Escalation (Admin Route Abuse)
  describe('ATTACK VECTOR 5: Vertical Privilege Escalation', () => {
    it('Rejects non-admin access to /api/admin/stats with 403', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${posterToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Administrator privileges required');
    });

    it('Rejects non-admin attempts to approve KYC verification', async () => {
      const res = await request(app)
        .patch(`/api/admin/verifications/fake-id`)
        .set('Authorization', `Bearer ${posterToken}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(403);
    });
  });

  // TEST 6: Business Logic Flaw (Self-Bidding)
  describe('ATTACK VECTOR 6: Business Logic Flaws & Marketplace Integrity', () => {
    it('Blocks poster from bidding on their own task', async () => {
      const res = await request(app)
        .post(`/api/offers/task/${targetTaskId}`)
        .set('Authorization', `Bearer ${posterToken}`)
        .send({
          amount: 50,
          message: 'I want to bid on my own task to boost activity.',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot submit an offer on your own task');
    });

    it('Rejects negative or zero budget manipulation via Zod', async () => {
      const categories = await prisma.category.findMany();
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${posterToken}`)
        .send({
          title: 'Negative Budget Exploit',
          description: 'Attempting negative budget parameter tampering',
          budget: -250,
          categoryId: categories[0].id,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('at least $5');
    });
  });
});
