import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.tag.findMany({ where: { userId }, orderBy: { name: 'asc' } });
  }

  async findOne(userId: string, id: string) {
    const tag = await this.prisma.tag.findFirst({ where: { id, userId } });
    if (!tag) throw new NotFoundException('Tag not found');
    return tag;
  }

  async create(userId: string, data: { name: string; colorHex?: string }) {
    try {
      return await this.prisma.tag.create({ data: { userId, ...data } });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Tag name already exists');
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

  async update(userId: string, id: string, data: Prisma.TagUpdateInput) {
    await this.findOne(userId, id);
    return this.prisma.tag.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.tag.delete({ where: { id } });
  }
}
