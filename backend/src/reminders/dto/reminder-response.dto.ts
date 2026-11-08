import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority } from '@prisma/client';

export class ReminderResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'ID of the task requiring attention',
  })
  id!: string;

  @ApiProperty({ example: 'Prepare presentation' })
  title!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dueAt!: Date;

  @ApiProperty({ enum: TaskPriority })
  priority!: TaskPriority;

  @ApiProperty({ enum: ['overdue', 'upcoming'] })
  kind!: 'overdue' | 'upcoming';
}
