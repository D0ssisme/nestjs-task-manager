import { INestApplication, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { vi } from 'vitest';
import bcrypt from 'bcrypt';
import { TasksService } from '../src/tasks/tasks.service.js';
import { saveEvidence } from './evidence.js';
import request from 'supertest';
import { App } from 'supertest/types.js';

describe('API e2e', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const primaryEmail = `e2e-primary-${suffix}@example.com`;
  const secondaryEmail = `e2e-secondary-${suffix}@example.com`;
  const password = 'E2e@12345';
  let primaryUserId: string;
  let secondaryUserId: string;
  let accessToken: string;
  let categoryId: string;
  let tagId: string;
  let taskId: string;

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (primaryUserId) {
      await prisma.user.delete({ where: { id: primaryUserId } });
    }
    if (secondaryUserId) {
      await prisma.user.delete({ where: { id: secondaryUserId } });
    }
    await app?.close();
  });

  it('registers the primary user and returns a JWT', async () => {
    const response = await http()
      .post('/auth/register')
      .send({
        email: primaryEmail,
        password,
        fullName: 'E2E Primary',
      })
      .expect(201);

    expect(response.body.user.email).toBe(primaryEmail);
    expect(response.body.accessToken).toEqual(expect.any(String));
    primaryUserId = response.body.user.id;
    accessToken = response.body.accessToken;
  });

  it('rejects duplicate email registration with 409', async () => {
    await http()
      .post('/auth/register')
      .send({ email: primaryEmail, password })
      .expect(409);
  });

  it('rejects invalid DTO data with 400', async () => {
    await http()
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);
  });

  it('rejects invalid login credentials with 401', async () => {
    await http()
      .post('/auth/login')
      .send({ email: primaryEmail, password: 'Wrong@12345' })
      .expect(401);
  });

  it('rejects protected resources without a token with 401', async () => {
    await http().get('/tasks').expect(401);
  });

  it('creates a second user for ownership checks', async () => {
    const response = await http()
      .post('/auth/register')
      .send({
        email: secondaryEmail,
        password,
        fullName: 'E2E Secondary',
      })
      .expect(201);

    secondaryUserId = response.body.user.id;
  });

  it('creates a category and rejects duplicate category names', async () => {
    const response = await http()
      .post('/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `E2E Category ${suffix}`, colorHex: '#3B82F6' })
      .expect(201);

    categoryId = response.body.id;

    await http()
      .post('/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `E2E Category ${suffix}` })
      .expect(409);
  });

  it('creates a tag and rejects duplicate tag names', async () => {
    const response = await http()
      .post('/tags')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `e2e-tag-${suffix}`, colorHex: '#EF4444' })
      .expect(201);

    tagId = response.body.id;

    await http()
      .post('/tags')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: `e2e-tag-${suffix}` })
      .expect(409);

    await http()
      .get(`/tags/${tagId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('creates and reads a task through the protected CRUD flow', async () => {
    const response = await http()
      .post('/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: `E2E Task ${suffix}`,
        description: 'Created by the end-to-end test',
        priority: 'HIGH',
        categoryId,
      })
      .expect(201);

    taskId = response.body.id;

    const taggedTask = await http()
      .post(`/tasks/${taskId}/tags`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tagId })
      .expect(201);
    expect(taggedTask.body.taskTags.some((taskTag: { tagId: string }) => taskTag.tagId === tagId)).toBe(true);

    const listResponse = await http()
      .get(`/tasks?priority=HIGH&categoryId=${categoryId}&page=1&limit=10&sortBy=createdAt&order=desc`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(listResponse.body.data.some((task: { id: string }) => task.id === taskId)).toBe(true);
    expect(listResponse.body.meta).toEqual(expect.objectContaining({ page: 1, limit: 10 }));
  });

  it('does not expose another user resource and returns 404', async () => {
    await http()
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const secondaryLogin = await http()
      .post('/auth/login')
      .send({ email: secondaryEmail, password })
      .expect(201);

    await http()
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${secondaryLogin.body.accessToken}`)
      .expect(404);
  });

  it('returns 404 for a missing resource', async () => {
    await http()
      .get('/tasks/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('updates status, sets completedAt, detaches the tag, and deletes the task', async () => {
    const updateResponse = await http()
      .patch(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'DONE' })
      .expect(200);
    expect(updateResponse.body.status).toBe('DONE');
    expect(updateResponse.body.completedAt).toEqual(expect.any(String));

    await http()
      .delete(`/tasks/${taskId}/tags/${tagId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await http()
      .delete(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);
  });

  it('rejects malformed route IDs and invalid pagination with 400', async () => {
    for (const path of ['/tasks/not-a-uuid', '/categories/not-a-uuid', '/tags/not-a-uuid', '/tasks?limit=101', '/tasks?page=0']) {
      await http().get(path).set('Authorization', 'Bearer ' + accessToken).expect(400);
    }
  });

  it('returns the authenticated profile and publishes Swagger routes', async () => {
    const profile = await http().get('/auth/me').set('Authorization', 'Bearer ' + accessToken).expect(200);
    expect(profile.body.id).toBe(primaryUserId);
    expect(profile.body).not.toHaveProperty('passwordHash');
    const docs = await http().get('/api-json').expect(200);
    expect(docs.body.paths).toHaveProperty('/reminders');
    expect(docs.body.paths).toHaveProperty('/tasks/{id}');
  });

  it('returns 409 when renaming a category or tag to an existing name', async () => {
    for (const [route, existingId, name] of [
      ['categories', categoryId, 'E2E Category ' + suffix],
      ['tags', tagId, 'e2e-tag-' + suffix],
    ]) {
      const created = await http().post('/' + route).set('Authorization', 'Bearer ' + accessToken)
        .send({ name: 'other-' + suffix }).expect(201);
      await http().patch('/' + route + '/' + created.body.id).set('Authorization', 'Bearer ' + accessToken)
        .send({ name }).expect(409);
      const updated = await http().patch('/' + route + '/' + existingId).set('Authorization', 'Bearer ' + accessToken)
        .send({ name: 'renamed-' + suffix }).expect(200);
      expect(updated.body.name).toBe('renamed-' + suffix);
      await http().delete('/' + route + '/' + created.body.id).set('Authorization', 'Bearer ' + accessToken).expect(204);
    }
  });

  it('scopes reminders to the user and excludes completed, archived, undated and distant tasks', async () => {
    const now = Date.now();
    const overdue = new Date(now - 60_000);
    const upcoming = new Date(now + 60 * 60_000);
    const fixtures = [
      { title: 'overdue-' + suffix, userId: primaryUserId, dueAt: overdue },
      { title: 'upcoming-' + suffix, userId: primaryUserId, dueAt: upcoming },
      { title: 'done-' + suffix, userId: primaryUserId, dueAt: overdue, status: 'DONE' as const },
      { title: 'archived-' + suffix, userId: primaryUserId, dueAt: overdue, status: 'ARCHIVED' as const },
      { title: 'undated-' + suffix, userId: primaryUserId },
      { title: 'distant-' + suffix, userId: primaryUserId, dueAt: new Date(now + 48 * 60 * 60_000) },
      { title: 'other-user-' + suffix, userId: secondaryUserId, dueAt: overdue },
    ];
    await prisma.task.createMany({ data: fixtures });
    const response = await http().get('/reminders').set('Authorization', 'Bearer ' + accessToken).expect(200);
    expect(response.body.map((item: { title: string; kind: string }) => ({ title: item.title, kind: item.kind }))).toEqual([
      { title: 'overdue-' + suffix, kind: 'overdue' },
      { title: 'upcoming-' + suffix, kind: 'upcoming' },
    ]);
    const id = response.body[0].id;
    await http().patch('/tasks/' + id).set('Authorization', 'Bearer ' + accessToken).send({ status: 'DONE' }).expect(200);
    const refreshed = await http().get('/reminders').set('Authorization', 'Bearer ' + accessToken).expect(200);
    expect(refreshed.body.map((item: { id: string }) => item.id)).not.toContain(id);
    await http().get('/reminders').expect(401);
  });

  it('matches request IDs between success/error headers, error bodies and timed logs', async () => {
    const successLog = vi.spyOn(Logger.prototype, 'log');
    const errorLog = vi.spyOn(Logger.prototype, 'error');
    try {
      const success = await http().get('/tasks').set('Authorization', 'Bearer ' + accessToken)
        .set('X-Request-ID', 'e2e-success').expect(200);
      expect(success.headers['x-request-id']).toBe('e2e-success');
      const denied = await http().get('/tasks').set('X-Request-ID', 'e2e-denied').expect(401);
      expect(denied.headers['x-request-id']).toBe('e2e-denied');
      expect(denied.body.requestId).toBe('e2e-denied');
      const invalid = await http().get('/tasks/not-a-uuid').set('Authorization', 'Bearer ' + accessToken)
        .set('X-Request-ID', 'e2e-invalid').expect(400);
      expect(invalid.body.requestId).toBe('e2e-invalid');
      const parse = (calls: unknown[][]): Array<Record<string, unknown>> => calls.flatMap(([message]) => {
        try { return typeof message === 'string' ? [JSON.parse(message) as Record<string, unknown>] : []; } catch { return []; }
      });
      expect(parse(successLog.mock.calls)).toContainEqual(expect.objectContaining({ requestId: 'e2e-success', statusCode: 200, durationMs: expect.any(Number) }));
      for (const [requestId, statusCode] of [['e2e-denied', 401], ['e2e-invalid', 400]]) {
        const logs = parse(errorLog.mock.calls).filter(entry => entry.requestId === requestId);
        expect(logs).toHaveLength(1);
        expect(logs[0]).toEqual(expect.objectContaining({ statusCode, durationMs: expect.any(Number) }));
      }
      const generated = await http().get('/tasks').expect(401);
      expect(generated.body.requestId).toBe(generated.headers['x-request-id']);
      expect(generated.body.requestId).toMatch(/^[0-9a-f-]{36}$/);
      saveEvidence('request-id', {
        successHeader: success.headers['x-request-id'],
        deniedHeader: denied.headers['x-request-id'],
        deniedBody: denied.body,
        invalidBody: invalid.body,
        successLogs: parse(successLog.mock.calls),
        errorLogs: parse(errorLog.mock.calls),
        passed: true,
      });
    } finally {
      successLog.mockRestore();
      errorLog.mockRestore();
    }
  });

  it('logs unexpected failures as 500 without exposing internal details', async () => {
    const database = vi.spyOn(prisma.task, 'findMany').mockRejectedValueOnce(new Error('private database detail'));
    const errorLog = vi.spyOn(Logger.prototype, 'error');
    try {
      const response = await http().get('/tasks').set('Authorization', 'Bearer ' + accessToken)
        .set('X-Request-ID', 'e2e-server-error').expect(500);
      expect(response.body.message).toBe('Internal server error');
      expect(response.body.requestId).toBe('e2e-server-error');
      expect(errorLog.mock.calls.some(([message]) => typeof message === 'string' && message.includes('"statusCode":500') && message.includes('e2e-server-error'))).toBe(true);
    } finally {
      database.mockRestore();
      errorLog.mockRestore();
    }
  });


  it('edits all task fields, clears optional fields, and rejects null required fields', async () => {
    const created = await http().post('/tasks').set('Authorization', 'Bearer ' + accessToken)
      .send({ title: 'editable-' + suffix, categoryId, dueAt: new Date(Date.now() + 60_000).toISOString() }).expect(201);
    const path = '/tasks/' + created.body.id;
    const changed = await http().patch(path).set('Authorization', 'Bearer ' + accessToken)
      .send({ title: 'edited-' + suffix, description: 'Updated description', priority: 'URGENT', categoryId: null, dueAt: null }).expect(200);
    expect(changed.body).toEqual(expect.objectContaining({ title: 'edited-' + suffix, description: 'Updated description', priority: 'URGENT', categoryId: null, dueAt: null }));
    for (const field of ['title', 'priority', 'status']) {
      await http().patch(path).set('Authorization', 'Bearer ' + accessToken).send({ [field]: null }).expect(400);
    }
    await http().delete(path).set('Authorization', 'Bearer ' + accessToken).expect(204);
  });

  it('prevents another user from editing/deleting data or attaching foreign relations', async () => {
    const login = await http().post('/auth/login').send({ email: secondaryEmail, password }).expect(201);
    const otherAuth = 'Bearer ' + login.body.accessToken;
    const primaryTask = await http().post('/tasks').set('Authorization', 'Bearer ' + accessToken).send({ title: 'owned-' + suffix }).expect(201);
    for (const [route, id] of [['tasks', primaryTask.body.id], ['categories', categoryId], ['tags', tagId]]) {
      await http().patch('/' + route + '/' + id).set('Authorization', otherAuth).send(route === 'tasks' ? { title: 'forbidden' } : { name: 'forbidden' }).expect(404);
      await http().delete('/' + route + '/' + id).set('Authorization', otherAuth).expect(404);
    }
    await http().post('/tasks').set('Authorization', otherAuth).send({ title: 'invalid relation', categoryId }).expect(400);
    const otherTask = await http().post('/tasks').set('Authorization', otherAuth).send({ title: 'other-owned-' + suffix }).expect(201);
    await http().post('/tasks/' + otherTask.body.id + '/tags').set('Authorization', otherAuth).send({ tagId }).expect(400);
  });

  it('rejects undeclared body properties before calling the task service', async () => {
    const create = vi.spyOn(app.get(TasksService), 'create');
    try {
      const response = await http().post('/tasks').set('Authorization', 'Bearer ' + accessToken)
        .send({ title: 'must-not-be-created', unexpectedField: true }).expect(400);
      expect(response.body.message).toContain('property unexpectedField should not exist');
      expect(create).not.toHaveBeenCalled();
      saveEvidence('validation', { endpoint: 'POST /tasks', status: response.status, message: response.body.message, serviceCalls: create.mock.calls.length, passed: true });
    } finally { create.mockRestore(); }
  });

  it('stores a bcrypt password hash and rejects tampered JWTs', async () => {
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: primaryUserId } });
    expect(stored.passwordHash).not.toBe(password);
    expect(await bcrypt.compare(password, stored.passwordHash)).toBe(true);
    const parts = accessToken.split('.');
    parts[2] = (parts[2][0] === 'a' ? 'b' : 'a') + parts[2].slice(1);
    await http().get('/auth/me').set('Authorization', 'Bearer ' + parts.join('.')).expect(401);
    saveEvidence('authentication', { bcryptHashVerified: true, tamperedTokenStatus: 401, passed: true });
  });

  it('documents feature routes, Bearer security and request/response DTO schemas', async () => {
    await http().get('/api').expect(200);
    const response = await http().get('/api-json').expect(200);
    const document = response.body;
    for (const path of ['/auth/register', '/auth/login', '/auth/me', '/tasks', '/tasks/{id}', '/categories', '/tags', '/reminders']) {
      expect(document.paths[path]).toBeDefined();
    }
    expect(document.components.securitySchemes['access-token']).toEqual(expect.objectContaining({ type: 'http', scheme: 'bearer' }));
    expect(document.paths['/tasks'].get.security).toContainEqual({ 'access-token': [] });
    expect(document.components.schemas.CreateTaskDto.required).toContain('title');
    expect(document.components.schemas.ApiErrorResponseDto.properties).toHaveProperty('requestId');
    expect(document.components.schemas.ApiErrorResponseDto.properties).toHaveProperty('timestamp');
    expect(document.paths['/reminders'].get.responses['200'].content['application/json'].schema.items.$ref).toBe('#/components/schemas/ReminderResponseDto');
    saveEvidence('openapi', document);
  });
});
