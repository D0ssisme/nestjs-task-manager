import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string, status?: TaskStatus) {
    return this.prisma.task.findMany({
      where: { userId, ...(status ? { status } : {}) },
      include: { category: true, taskTags: { include: { tag: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
      include: { category: true, taskTags: { include: { tag: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(userId: string, data: {
    title: string; description?: string; status?: TaskStatus; priority?: TaskPriority;
    categoryId?: string; parentId?: string; dueAt?: Date;
  }) {
    return this.prisma.task.create({ data: { userId, ...data } });
  }

  async update(userId: string, id: string, data: Prisma.TaskUpdateInput) {
    await this.findOne(userId, id);
    return this.prisma.task.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.task.delete({ where: { id } });
  }
}
