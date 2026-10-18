import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.category.findMany({ where: { userId }, orderBy: { name: 'asc' } });
  }

  async findOne(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(userId: string, data: { name: string; colorHex?: string; icon?: string }) {
    try {
      return await this.prisma.category.create({ data: { userId, ...data } });
    } catch (error) {
<<<<<<< HEAD
      if (this.isUniqueConstraintError(error)) {
=======
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
>>>>>>> cb82f4c50264025683bdda103bc293e1f8baf724
        throw new ConflictException('Category name already exists');
      }
      throw error;
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return typeof error === 'object'
      && error !== null
      && 'code' in error
      && error.code === 'P2002';
  }

  async update(userId: string, id: string, data: Prisma.CategoryUpdateInput) {
    await this.findOne(userId, id);
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.category.delete({ where: { id } });
  }
}
