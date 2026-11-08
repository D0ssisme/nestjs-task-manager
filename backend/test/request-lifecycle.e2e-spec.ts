import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ContextIdFactory } from '@nestjs/core';
import { tap } from 'rxjs';
import request from 'supertest';
import { vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { TasksService } from '../src/tasks/tasks.service.js';
import { TasksController } from '../src/tasks/tasks.controller.js';
import { ListTasksQueryDto } from '../src/tasks/dto/task.dto.js';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard.js';
import { RequestIdMiddleware } from '../src/common/middleware/request-id.middleware.js';
import { RequestTimingInterceptor } from '../src/common/interceptors/request-timing.interceptor.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
import { saveEvidence } from './evidence.js';

// Instrument real application methods, forwarding every call to the real implementation.
// No demo controller, bypassed guard, fake ORM or production tracing endpoint is added.
describe('Technical coverage: real request lifecycle and DI', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  let trace: string[] | null = null;
  const proofs: Record<string, unknown> = {};
  const mark = (stage: string) => { trace?.push(stage); };

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- The spy forwards the original instance with apply().
    const middleware = RequestIdMiddleware.prototype.use;
    vi.spyOn(RequestIdMiddleware.prototype, 'use').mockImplementation(function (this: RequestIdMiddleware, ...args) {
      mark('middleware'); return middleware.apply(this, args);
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method -- The spy forwards the original instance with apply().
    const guard = JwtAuthGuard.prototype.canActivate;
    vi.spyOn(JwtAuthGuard.prototype, 'canActivate').mockImplementation(function (this: JwtAuthGuard, ...args) {
      mark('guard'); return guard.apply(this, args);
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method -- The spy forwards the original instance with apply().
    const interceptor = RequestTimingInterceptor.prototype.intercept;
    vi.spyOn(RequestTimingInterceptor.prototype, 'intercept').mockImplementation(function (this: RequestTimingInterceptor, ...args) {
      mark('interceptor.before');
      return interceptor.apply(this, args).pipe(tap({ next: () => mark('interceptor.after') }));
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method -- The spy forwards the original instance with apply().
    const pipe = ValidationPipe.prototype.transform;
    vi.spyOn(ValidationPipe.prototype, 'transform').mockImplementation(function (this: ValidationPipe, ...args) {
      if (args[1].metatype === ListTasksQueryDto) mark('pipe');
      return pipe.apply(this, args);
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method -- The spy forwards the original instance with apply().
    const handler = TasksController.prototype.findAll;
    vi.spyOn(TasksController.prototype, 'findAll').mockImplementation(function (this: TasksController, ...args) {
      mark('handler'); return handler.apply(this, args);
    });
    // Keep route/Swagger metadata when replacing the decorated method with a forwarding spy.
    for (const key of Reflect.getMetadataKeys(handler)) {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- Metadata target only; this reference is never invoked.
      Reflect.defineMetadata(key, Reflect.getMetadata(key, handler), TasksController.prototype.findAll);
    }
    // eslint-disable-next-line @typescript-eslint/unbound-method -- The spy forwards the original instance with apply().
    const service = TasksService.prototype.findAll;
    vi.spyOn(TasksService.prototype, 'findAll').mockImplementation(function (this: TasksService, ...args) {
      mark('service'); return service.apply(this, args);
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method -- The spy forwards the original instance with apply().
    const filter = AllExceptionsFilter.prototype.catch;
    vi.spyOn(AllExceptionsFilter.prototype, 'catch').mockImplementation(function (this: AllExceptionsFilter, ...args) {
      mark('filter'); return filter.apply(this, args);
    });
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    const query = prisma.task.findMany.bind(prisma.task);
    vi.spyOn(prisma.task, 'findMany').mockImplementation((...args) => {
      mark('orm.findMany'); return query(...args);
    });
    const registered = await request(app.getHttpServer()).post('/auth/register')
      .send({ email: `lifecycle-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`, password: 'Lifecycle@12345' }).expect(201);
    token = registered.body.accessToken;
    userId = registered.body.user.id;
  });

  afterAll(async () => {
    trace = null;
    if (userId) await prisma.user.delete({ where: { id: userId } });
    await app?.close();
    vi.restoreAllMocks();
    saveEvidence('request-lifecycle', proofs);
  });

  it('executes middleware, guard, interceptor, pipe, controller, service and real ORM in order', async () => {
    trace = [];
    const response = await request(app.getHttpServer()).get('/tasks?page=1&limit=2')
      .set('Authorization', 'Bearer ' + token).expect(200);
    expect(response.body.meta).toEqual(expect.objectContaining({ page: 1, limit: 2 }));
    expect(trace).toEqual(['middleware', 'guard', 'interceptor.before', 'pipe', 'handler', 'service', 'orm.findMany', 'interceptor.after']);
    proofs.success = { endpoint: 'GET /tasks?page=1&limit=2', status: response.status, stages: [...trace], passed: true };
    trace = null;
  });

  it('rejects an invalid query in the pipe without calling the handler or ORM', async () => {
    trace = [];
    const response = await request(app.getHttpServer()).get('/tasks?limit=0')
      .set('Authorization', 'Bearer ' + token).expect(400);
    expect(trace).toEqual(['middleware', 'guard', 'interceptor.before', 'pipe', 'filter']);
    proofs.invalidQuery = { endpoint: 'GET /tasks?limit=0', status: response.status, stages: [...trace], passed: true };
    trace = null;
  });

  it('rejects a missing token in the guard before interceptors, pipes and handlers', async () => {
    trace = [];
    const response = await request(app.getHttpServer()).get('/tasks').expect(401);
    expect(trace).toEqual(['middleware', 'guard', 'filter']);
    proofs.missingToken = { endpoint: 'GET /tasks', status: response.status, stages: [...trace], passed: true };
    trace = null;
  });

  it('resolves the same default-scope services across two request contexts', async () => {
    const first = ContextIdFactory.create();
    const second = ContextIdFactory.create();
    expect(await app.resolve(TasksService, first)).toBe(await app.resolve(TasksService, second));
    expect(await app.resolve(PrismaService, first)).toBe(await app.resolve(PrismaService, second));
    proofs.dependencyInjection = { tasksService: 'same instance across two contexts', prismaService: 'same instance across two contexts', passed: true };
  });
});

