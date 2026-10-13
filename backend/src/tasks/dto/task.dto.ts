import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { IsDate, IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Prepare project presentation' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'Finish slides and rehearse the demo' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.TODO })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.HIGH })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ format: 'uuid', example: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ format: 'uuid', example: '2d6f5b4a-6e2c-4a9c-9a51-8d5e7c3b1f20' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', example: '2026-10-20T09:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueAt?: Date;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Prepare final project presentation' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.DONE })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.URGENT })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ format: 'uuid', example: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ format: 'uuid', example: '2d6f5b4a-6e2c-4a9c-9a51-8d5e7c3b1f20' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', example: '2026-10-20T09:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueAt?: Date;
}

export enum TaskSortBy {
  DUE_AT = 'dueAt',
  CREATED_AT = 'createdAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ListTasksQueryDto {
  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.TODO })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.HIGH })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ format: 'uuid', example: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 20, default: 20, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 20;

  @ApiPropertyOptional({ enum: TaskSortBy, example: TaskSortBy.CREATED_AT, default: TaskSortBy.CREATED_AT })
  @IsOptional()
  @IsEnum(TaskSortBy)
  sortBy: TaskSortBy = TaskSortBy.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, example: SortOrder.DESC, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  order: SortOrder = SortOrder.DESC;
}

export class AttachTagDto {
  @ApiProperty({ format: 'uuid', example: 'a1b2c3d4-e5f6-4789-abcd-1234567890ab' })
  @IsUUID()
  tagId!: string;
}
