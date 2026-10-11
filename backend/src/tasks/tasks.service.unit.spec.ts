import { NotFoundException } from '@nestjs/common';
import { jest } from '@jest/globals';
import { TasksService } from './tasks.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: {
    task: {
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      task: {
        findMany: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
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
