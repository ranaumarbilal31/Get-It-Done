import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { io as connect } from 'socket.io-client';
import { app, server } from '../src/server.js';
import prisma from '../src/config/prisma.js';
let poster, tasker, admin, task, origin;
const sockets = [];
const socket = async (token, extraHeaders) => {
  const client = connect(origin, {
    auth: { token },
    extraHeaders,
    transports: ['websocket'],
    reconnection: false,
  });
  sockets.push(client);
  await new Promise((resolve, reject) => {
    client.once('connect', resolve);
    client.once('connect_error', reject);
  });
  return client;
};
const emit = (client, event, payload) =>
  new Promise((resolve) => client.emit(event, payload, resolve));
beforeAll(async () => {
  poster = (
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah@example.com', password: 'Password123!' })
  ).body;
  tasker = (
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'alex@example.com', password: 'Password123!' })
  ).body;
  admin = (
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@getitdone.com', password: 'Password123!' })
  ).body;
  const category = await prisma.category.findFirst();
  task = await prisma.task.create({
    data: {
      title: 'Private chat regression task',
      description: 'An isolated conversation test.',
      budget: 100,
      categoryId: category.id,
      posterId: poster.user.id,
      status: 'ASSIGNED',
      offers: {
        create: {
          taskerId: tasker.user.id,
          amount: 100,
          message: 'Accepted offer',
          status: 'ACCEPTED',
        },
      },
    },
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
});
afterAll(async () => {
  sockets.forEach((client) => client.disconnect());
  await new Promise((resolve) => app.get('io').close(resolve));
});
describe('Public profiles and private conversations', () => {
  it('rejects authenticated sockets from an untrusted browser origin', async () => {
    await expect(socket(poster.token, { Origin: 'https://untrusted.example' })).rejects.toThrow();
  });
  it('applies category and search together', async () => {
    const category = await prisma.category.findFirst({ where: { id: { not: task.categoryId } } });
    const res = await request(app)
      .get('/api/tasks')
      .query({ category: category.slug, search: task.title, status: 'ALL' });
    expect(res.status).toBe(200);
    expect(res.body.tasks).toEqual([]);
  });
  it('returns the requested public profile with no private fields', async () => {
    const res = await request(app)
      .get('/api/users/' + tasker.user.id)
      .set('Authorization', 'Bearer ' + poster.token);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(tasker.user.id);
    expect(Object.keys(res.body.user).sort()).toEqual(
      ['id', 'name', 'avatar', 'bio', 'isVerified', 'ratingAvg', 'ratingCount', 'createdAt'].sort(),
    );
  });
  it('returns 404 for a missing public profile', async () => {
    expect((await request(app).get('/api/users/missing')).status).toBe(404);
  });
  it('denies REST chat access to another account, including administrators', async () => {
    expect(
      (
        await request(app)
          .get('/api/messages/task/' + task.id)
          .set('Authorization', 'Bearer ' + admin.token)
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post('/api/messages/task/' + task.id)
          .set('Authorization', 'Bearer ' + admin.token)
          .send({ content: 'Intrusion' })
      ).status,
    ).toBe(403);
  });
  it('rejects sockets with missing or forged tokens', async () => {
    await expect(socket()).rejects.toThrow('Authentication required');
    await expect(socket('forged')).rejects.toThrow('Authentication required');
  });
  it('rejects foreign notification channels and unauthorized task rooms', async () => {
    const client = await socket(admin.token);
    expect((await emit(client, 'join_user', tasker.user.id)).ok).toBe(false);
    expect((await emit(client, 'join_task', task.id)).ok).toBe(false);
    expect(
      (
        await emit(client, 'send_message', {
          taskId: task.id,
          senderId: poster.user.id,
          receiverId: tasker.user.id,
          content: 'Spoofed',
        })
      ).ok,
    ).toBe(false);
  });
  it('derives sender identity and allows the hired parties to communicate', async () => {
    const client = await socket(poster.token);
    expect((await emit(client, 'join_task', task.id)).ok).toBe(true);
    const result = await emit(client, 'send_message', {
      taskId: task.id,
      senderId: admin.user.id,
      content: 'A real message',
    });
    expect(result.ok).toBe(true);
    expect(result.message.senderId).toBe(poster.user.id);
    expect(result.message.receiverId).toBe(tasker.user.id);
  });
  it('rejects unrelated recipients and invalid content through REST', async () => {
    for (const body of [
      { content: 'Wrong recipient', receiverId: admin.user.id },
      { content: ' ' },
      { content: 'x'.repeat(5001) },
    ]) {
      const res = await request(app)
        .post('/api/messages/task/' + task.id)
        .set('Authorization', 'Bearer ' + poster.token)
        .send(body);
      expect([400, 403]).toContain(res.status);
    }
  });
});
