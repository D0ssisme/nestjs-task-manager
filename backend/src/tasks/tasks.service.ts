import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskDto, ListTasksQueryDto, SortOrder, TaskSortBy, UpdateTaskDto } from './dto/task.dto.js';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: ListTasksQueryDto = new ListTasksQueryDto()) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? TaskSortBy.CREATED_AT;
    const order = query.order ?? SortOrder.DESC;
    const where: Prisma.TaskWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
      include: { category: true, taskTags: { include: { tag: true } } },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
      include: { category: true, taskTags: { include: { tag: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(userId: string, data: CreateTaskDto) {
    await this.validateRelations(userId, data.categoryId, data.parentId);
    const createData: Prisma.TaskUncheckedCreateInput = {
      userId,
      title: data.title,
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
      ...(data.dueAt !== undefined ? { dueAt: data.dueAt } : {}),
      ...(data.status === TaskStatus.DONE ? { completedAt: new Date() } : {}),
    };
    return this.prisma.task.create({
      data: createData,
      include: { category: true, taskTags: { include: { tag: true } } },
    });
  }

  async update(userId: string, id: string, data: UpdateTaskDto) {
    const existing = await this.findOne(userId, id);
    const categoryId = typeof data.categoryId === 'string' ? data.categoryId : undefined;
    const parentId = typeof data.parentId === 'string' ? data.parentId : undefined;
    await this.validateRelations(userId, categoryId, parentId);
    const nextStatus = data.status;
    let completedAt: Date | null | undefined;
    if (nextStatus === TaskStatus.DONE) {
      completedAt = existing.status === TaskStatus.DONE ? existing.completedAt : new Date();
    } else if (nextStatus !== undefined) {
      completedAt = null;
    }
    const updateData: Prisma.TaskUncheckedUpdateInput = {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
      ...(data.dueAt !== undefined ? { dueAt: data.dueAt } : {}),
      ...(completedAt !== undefined ? { completedAt } : {}),
    };
    return this.prisma.task.update({
      where: { id },
      data: updateData,
      include: { category: true, taskTags: { include: { tag: true } } },
    });
  }

  async attachTag(userId: string, taskId: string, tagId: string) {
    await this.findOne(userId, taskId);
    await this.ensureTagOwnership(userId, tagId);
    try {
      await this.prisma.taskTag.create({ data: { taskId, tagId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Tag is already attached to this task');
      }
      throw error;
    }
    return this.findOne(userId, taskId);
  }

  async detachTag(userId: string, taskId: string, tagId: string) {
    await this.findOne(userId, taskId);
    await this.ensureTagOwnership(userId, tagId);
    const result = await this.prisma.taskTag.deleteMany({ where: { taskId, tagId } });
    if (result.count === 0) throw new NotFoundException('Tag is not attached to this task');
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.task.delete({ where: { id } });
  }

  private async validateRelations(userId: string, categoryId?: string, parentId?: string) {
    if (categoryId) {
      const category = await this.prisma.category.findFirst({ where: { id: categoryId, userId } });
      if (!category) throw new BadRequestException('Category does not belong to the current user');
    }
    if (parentId) {
      const parent = await this.prisma.task.findFirst({ where: { id: parentId, userId } });
      if (!parent) throw new BadRequestException('Parent task does not belong to the current user');
    }
  }

  private async ensureTagOwnership(userId: string, tagId: string) {
    const tag = await this.prisma.tag.findFirst({ where: { id: tagId, userId } });
    if (!tag) throw new BadRequestException('Tag does not belong to the current user');
  }
}
