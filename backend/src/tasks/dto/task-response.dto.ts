import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto.js';
import { TagResponseDto } from '../../tags/dto/tag-response.dto.js';

export class TaskTagResponseDto {
  @ApiProperty({ type: TagResponseDto })
  tag!: TagResponseDto;
}

export class TaskResponseDto {
  @ApiProperty({ format: 'uuid', example: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67' })
  id!: string;

  @ApiProperty({ format: 'uuid', example: '11111111-1111-4111-8111-111111111111' })
  userId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true, example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' })
  categoryId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true, example: null })
  parentId!: string | null;

  @ApiProperty({ example: 'Prepare project presentation' })
  title!: string;

  @ApiPropertyOptional({ example: 'Finish slides and rehearse the demo', nullable: true })
  description!: string | null;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.TODO })
  status!: TaskStatus;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.HIGH })
  priority!: TaskPriority;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true, example: '2026-10-20T09:00:00.000Z' })
  dueAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true, example: null })
  completedAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-10-13T09:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-10-13T09:00:00.000Z' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: CategoryResponseDto, nullable: true })
  category!: CategoryResponseDto | null;

  @ApiProperty({ type: [TaskTagResponseDto] })
  taskTags!: TaskTagResponseDto[];
}

export class TaskListResponseDto {
  @ApiProperty({ type: [TaskResponseDto] })
  data!: TaskResponseDto[];

  @ApiProperty({
    example: { page: 1, limit: 20, total: 1, totalPages: 1 },
  })
  meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
