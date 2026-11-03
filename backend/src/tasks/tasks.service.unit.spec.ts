import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { TasksService } from './tasks.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: {
    task: {
      findMany: Mock;
      count: Mock;
      findFirst: Mock;
      create: Mock;
      update: Mock;
      delete: Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      task: {
        findMany: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    service = new TasksService(prisma as unknown as PrismaService);
  });

  it('scopes task queries to the authenticated user', async () => {
    prisma.task.findMany.mockResolvedValue([]);

    await service.findAll('user-1');

    expect(prisma.task.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-1' },
    }));
  });

  it('throws NotFoundException when a task is not owned by the user', async () => {
    prisma.task.findFirst.mockResolvedValue(null);

    await expect(service.findOne('user-1', 'task-1'))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a task with the authenticated user id', async () => {
    const task = { id: 'task-1', userId: 'user-1', title: 'Test task' };
    prisma.task.create.mockResolvedValue(task);

    await expect(service.create('user-1', { title: 'Test task' }))
      .resolves.toBe(task);
    expect(prisma.task.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', title: 'Test task' },
      include: { category: true, taskTags: { include: { tag: true } } },
    });
  });
});
