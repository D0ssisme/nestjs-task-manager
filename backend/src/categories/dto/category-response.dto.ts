import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ format: 'uuid', example: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67' })
  id!: string;

  @ApiProperty({ format: 'uuid', example: '11111111-1111-4111-8111-111111111111' })
  userId!: string;

  @ApiProperty({ example: 'Work' })
  name!: string;

  @ApiProperty({ example: '#2563EB' })
  colorHex!: string;

  @ApiPropertyOptional({ example: 'briefcase', nullable: true })
  icon!: string | null;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-10-13T09:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-10-13T09:00:00.000Z' })
  updatedAt!: Date;
}
