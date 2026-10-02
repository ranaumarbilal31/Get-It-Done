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

  // TEST 7: CORS Origin Spoofing
  describe('ATTACK VECTOR 7: Arbitrary CORS Origin Spoofing', () => {
    it('Blocks arbitrary untrusted origin from credential reflection', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'https://malicious-attacker.com');

      // Untrusted origins must not receive Access-Control-Allow-Origin
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('Permits authorized production origin (steel)', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'https://get-it-done-steel.vercel.app');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('https://get-it-done-steel.vercel.app');
    });

    it('Permits authorized legacy/staging origin (phalanx1)', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'https://get-it-done-phalanx1.vercel.app');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('https://get-it-done-phalanx1.vercel.app');
    });

    it('Disallows untrusted origin without triggering HTTP 500 server crash', async () => {
      const res = await request(app)
        .get('/api/tasks?limit=1')
        .set('Origin', 'https://example.com');

      // Crucial: Must NOT throw 500
      expect(res.status).not.toBe(500);
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  // TEST 8: PII / Task Coordinate & Address Exposure
  describe('ATTACK VECTOR 8: Task Location & PII Privacy Leak', () => {
    let piiTaskId = '';

    beforeAll(async () => {
      const categories = await prisma.category.findMany();
      const task = await prisma.task.create({
        data: {
          title: 'Private Home Repair',
          description: 'Fixing electrical panel in basement',
          budget: 120,
          status: 'OPEN',
          location: '742 Evergreen Terrace, Springfield, OR',
          latitude: 44.046234,
          longitude: -123.022091,
          posterId: (await prisma.user.findFirst({ where: { email: 'sarah@example.com' } })).id,
          categoryId: categories[0].id,
        },
      });
      piiTaskId = task.id;
    });

    it('Masks street address, fuzzes coordinates, and strips assignedOfferId for public viewers', async () => {
      const res = await request(app).get(`/api/tasks/${piiTaskId}`);
      expect(res.status).toBe(200);
      expect(res.body.task.location).not.toContain('742');
      expect(res.body.task.location).toBe('Evergreen Terrace, Springfield, OR');
      expect(res.body.task.latitude).toBe(44.05);
      expect(res.body.task.longitude).toBe(-123.02);
      expect(res.body.task.assignedOfferId).toBeUndefined();
      expect(res.body.task.categoryId).toBeUndefined();
      expect(res.body.task.payment).toBeUndefined();
    });
  });

  // TEST 9: Unbounded Pagination & Parameter Tampering
  describe('ATTACK VECTOR 9: Unbounded Pagination & Query Filter Validation', () => {
    it('Rejects limit=0 with 400 Bad Request', async () => {
      const res = await request(app).get('/api/tasks?limit=0');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_LIMIT');
    });

    it('Rejects negative limit with 400 Bad Request', async () => {
      const res = await request(app).get('/api/tasks?limit=-1');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_LIMIT');
    });

    it('Rejects excessively large limit (> 100) to prevent resource exhaustion', async () => {
      const res = await request(app).get('/api/tasks?limit=999999');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_LIMIT');
    });

    it('Rejects non-integer or zero page parameter', async () => {
      const resZero = await request(app).get('/api/tasks?page=0');
      expect(resZero.status).toBe(400);
      expect(resZero.body.code).toBe('INVALID_PAGINATION');

      const resAlpha = await request(app).get('/api/tasks?page=abc');
      expect(resAlpha.status).toBe(400);
      expect(resAlpha.body.code).toBe('INVALID_PAGINATION');
    });

    it('Rejects invalid status filter with 400 and INVALID_STATUS code', async () => {
      const res = await request(app).get('/api/tasks?status=NOT_A_STATUS');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_STATUS');
    });

    it('Rejects invalid budget range where min > max', async () => {
      const res = await request(app).get('/api/tasks?minBudget=500&maxBudget=100');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_BUDGET_RANGE');
    });
  });

  // TEST 10: API 404 Route Consistency
  describe('ATTACK VECTOR 10: Consistent API JSON 404 Handler', () => {
    it('Returns application/json 404 for non-existent /api routes', async () => {
      const res = await request(app).get('/api/users/12345');
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toContain('application/json');
      expect(res.body.code).toBe('NOT_FOUND');
      expect(res.body.message).toContain('does not exist');
    });

    it('Returns application/json 404 for arbitrary missing nested endpoints', async () => {
      const res = await request(app).post('/api/unknown/service/call');
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toContain('application/json');
      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  // TEST 11: Type Confusion, Array Parameter Injection & Null-Byte Defense
  describe('ATTACK VECTOR 11: Type Confusion, Array Parameter & Null-Byte Defense', () => {
    it('Rejects array-style category parameter (category[]=x) with 400 Bad Request without HTTP 500', async () => {
      const res = await request(app).get('/api/tasks?category[]=x');
      expect(res.status).toBe(400);
      expect(res.status).not.toBe(500);
      expect(res.body.code).toBe('INVALID_CATEGORY');
    });

    it('Rejects NUL byte in search parameter (search=%00) with 400 Bad Request without HTTP 500', async () => {
      const res = await request(app).get('/api/tasks?search=%00');
      expect(res.status).toBe(400);
      expect(res.status).not.toBe(500);
      expect(res.body.code).toBe('INVALID_INPUT');
    });

    it('Rejects prototype pollution attempt in sort parameter (sort=__proto__) with 400 Bad Request', async () => {
      const res = await request(app).get('/api/tasks?sort=__proto__');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('SUSPICIOUS_INPUT');
    });

    it('Rejects prototype pollution attempt in query key (__proto__[polluted]=true) with 400 Bad Request', async () => {
      const res = await request(app).get('/api/tasks?__proto__[polluted]=true');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('SUSPICIOUS_INPUT');
    });

    it('Rejects array-style search parameter (search[]=x) with 400 Bad Request', async () => {
      const res = await request(app).get('/api/tasks?search[]=x');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_SEARCH');
    });

    it('Rejects array-style status parameter (status[]=OPEN) with 400 Bad Request', async () => {
      const res = await request(app).get('/api/tasks?status[]=OPEN');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_STATUS');
    });

    it('Rejects array-style sortBy parameter (sortBy[]=title) with 400 Bad Request', async () => {
      const res = await request(app).get('/api/tasks?sortBy[]=title');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_SORT_BY');
    });
  });

  // TEST 12: KYC Role Ineligibility Guard & Safe Multer File Upload Defense (E-01 & E-02)
  describe('ATTACK VECTOR 12: KYC Role Ineligibility Guard & Safe File Upload Defense (E-01 & E-02)', () => {
    let unverifiedToken = '';
    let pendingToken = '';

    beforeAll(async () => {
      const davidRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'david@example.com', password: 'Password123!' });
      unverifiedToken = davidRes.body.token;

      const jessicaRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'jessica@example.com', password: 'Password123!' });
      pendingToken = jessicaRes.body.token;
    });

    it('Rejects POST /api/auth/verify-id for POSTER account with 403 ROLE_INELIGIBLE before file parsing (E-02)', async () => {
      const res = await request(app)
        .post('/api/auth/verify-id')
        .set('Authorization', `Bearer ${posterToken}`)
        .attach('idDocument', Buffer.from('fake plaintext id content'), 'fake_id.txt');

      expect(res.status).toBe(403);
      expect(res.status).not.toBe(500);
      expect(res.body.code).toBe('ROLE_INELIGIBLE');
      expect(res.body.message).toContain('ineligible for Tasker KYC');
    });

    it('Rejects POST /api/auth/verify-id for ADMIN account with 403 ROLE_INELIGIBLE before file parsing (E-02)', async () => {
      const res = await request(app)
        .post('/api/auth/verify-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('idDocument', Buffer.from('fake plaintext id content'), 'fake_id.txt');

      expect(res.status).toBe(403);
      expect(res.status).not.toBe(500);
      expect(res.body.code).toBe('ROLE_INELIGIBLE');
    });

    it('Rejects POST /api/auth/verify-id for already-verified Tasker with 400 ALREADY_VERIFIED (E-02)', async () => {
      const res = await request(app)
        .post('/api/auth/verify-id')
        .set('Authorization', `Bearer ${taskerToken}`)
        .attach('idDocument', Buffer.from('fake plaintext id content'), 'fake_id.txt');

      expect(res.status).toBe(400);
      expect(res.status).not.toBe(500);
      expect(res.body.code).toBe('ALREADY_VERIFIED');
    });

    it('Rejects POST /api/auth/verify-id for pending KYC user with 400 VERIFICATION_PENDING (E-02)', async () => {
      const res = await request(app)
        .post('/api/auth/verify-id')
        .set('Authorization', `Bearer ${pendingToken}`)
        .attach('idDocument', Buffer.from('fake plaintext id content'), 'fake_id.txt');

      expect(res.status).toBe(400);
      expect(res.status).not.toBe(500);
      expect(res.body.code).toBe('VERIFICATION_PENDING');
    });

    it('Returns HTTP 400 INVALID_FILE_TYPE when eligible applicant uploads harmless invalid file (.txt) (E-01)', async () => {
      const res = await request(app)
        .post('/api/auth/verify-id')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .attach('idDocument', Buffer.from('This is a plain text file, not an image.'), 'document.txt');

      expect(res.status).toBe(400);
      expect(res.status).not.toBe(500);
      expect(res.body.code).toBe('INVALID_FILE_TYPE');
      expect(res.body.message).toContain('Only image files');
    });

    it('Accepts valid document upload (.png / .jpg / .pdf) for unverified applicant and sets PENDING state', async () => {
      const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      const res = await request(app)
        .post('/api/auth/verify-id')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .attach('idDocument', pngBuffer, 'valid_id.png')
        .field('notes', 'State Driver License Front');

      expect(res.status).toBe(200);
      expect(res.body.user.verificationStatus).toBe('PENDING');
    });
  });

  // TEST 13: Admin PII Protection & KYC Document Isolation (E-04)
  describe('ATTACK VECTOR 13: Admin PII Protection & KYC Document Isolation (E-04)', () => {
    it('GET /api/admin/users does NOT expose idDocument, verificationNotes, or walletBalance in bulk listings', async () => {
      const res = await request(app)
        .get('/api/admin/users?limit=50')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThan(0);

      for (const u of res.body.users) {
        expect(u.idDocument).toBeUndefined();
        expect(u.verificationNotes).toBeUndefined();
        expect(u.walletBalance).toBeUndefined();
      }
    });

    it('GET /api/admin/verifications/pending points document to authorized inspection endpoint', async () => {
      const res = await request(app)
        .get('/api/admin/verifications/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.pendingUsers)).toBe(true);

      for (const p of res.body.pendingUsers) {
        if (p.idDocument) {
          expect(p.idDocument).toMatch(/^\/api\/admin\/verifications\/[a-zA-Z0-9-]+\/document$/);
        }
      }
    });

    it('Rejects non-admin access to document inspection endpoint with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/verifications/fake-user-id/document')
        .set('Authorization', `Bearer ${taskerToken}`);

      expect(res.status).toBe(403);
    });
  });

  // TEST 14: Root API 404 Route Defense (E-05)
  describe('ATTACK VECTOR 14: Root API 404 Route Defense (E-05)', () => {
    it('GET /api returns application/json HTTP 404 (not HTML 200)', async () => {
      const res = await request(app).get('/api');
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toContain('application/json');
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('GET /api/does-not-exist returns application/json HTTP 404 (not HTML 200)', async () => {
      const res = await request(app).get('/api/does-not-exist');
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toContain('application/json');
      expect(res.body.code).toBe('NOT_FOUND');
    });
  });
});

