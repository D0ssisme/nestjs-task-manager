import { Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  async findForUser(userId: string) {
    const now = new Date();
    const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        dueAt: { lte: nextDay },
        status: { notIn: [TaskStatus.DONE, TaskStatus.ARCHIVED] },
      },
      select: {
        id: true,
        title: true,
        dueAt: true,
        priority: true,
      },
      orderBy: { dueAt: 'asc' },
    });

    return tasks.map((task) => ({
      ...task,
      kind: task.dueAt && task.dueAt < now ? 'overdue' : 'upcoming',
    }));
  }
}
