import { ApiProperty } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty({ format: 'uuid', example: 'a1b2c3d4-e5f6-4789-abcd-1234567890ab' })
  id!: string;

  @ApiProperty({ format: 'uuid', example: '11111111-1111-4111-8111-111111111111' })
  userId!: string;

  @ApiProperty({ example: 'urgent' })
  name!: string;

  @ApiProperty({ example: '#DC2626' })
  colorHex!: string;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-10-13T09:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-10-13T09:00:00.000Z' })
  updatedAt!: Date;
}
