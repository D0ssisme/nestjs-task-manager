import { IsHexColor, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsHexColor()
  colorHex?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsHexColor()
  colorHex?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;
}
