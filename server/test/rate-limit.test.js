import { it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';
it('limits account-security requests independently of account existence', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  try {
    for (let i = 0; i < 20; i++) {
      const r = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'unknown-rate-limit@example.com' });
      expect(r.status).not.toBe(429);
    }
    const limited = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'unknown-rate-limit@example.com' });
    expect(limited.status).toBe(429);
    expect(limited.headers['ratelimit-limit']).toBe('20');
  } finally {
    process.env.NODE_ENV = previous;
  }
});
