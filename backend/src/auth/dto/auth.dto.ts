import { IsEmail, IsOptional, IsString, IsStrongPassword, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'alice@example.com', description: 'Unique account email' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'StrongPass1!' })
  @IsStrongPassword()
  password!: string;

  @ApiPropertyOptional({ example: 'Alice Nguyen' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPass1!' })
  @IsString()
  password!: string;
}
