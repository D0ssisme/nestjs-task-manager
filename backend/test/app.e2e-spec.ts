import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AppModule } from '../src/app.module.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
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
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    app.useGlobalFilters(new AllExceptionsFilter());
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
    await app.close();
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

    const listResponse = await http()
      .get('/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(listResponse.body.some((task: { id: string }) => task.id === taskId)).toBe(true);
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

  it('updates and deletes the task', async () => {
    await http()
      .patch(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'DONE' })
      .expect(200);

    await http()
      .delete(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);
  });
});
