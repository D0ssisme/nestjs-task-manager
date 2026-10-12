import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto.js';
import { CategoriesService } from './categories.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiTags('categories')
@ApiBearerAuth('access-token')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  @ApiResponse({ status: 201, description: 'Category created', schema: { example: { id: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67', name: 'Work', colorHex: '#2563EB', icon: 'briefcase' } } })
  @ApiResponse({ status: 409, description: 'Category name already exists' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List current user categories' })
  @ApiResponse({ status: 200, description: 'Category list returned', schema: { example: [{ id: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67', name: 'Work', colorHex: '#2563EB', icon: 'briefcase' }] } })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.categoriesService.findAll(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiParam({ name: 'id', format: 'uuid', example: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.categoriesService.findOne(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', format: 'uuid', example: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67' })
  @ApiResponse({ status: 200, description: 'Category updated', schema: { example: { id: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67', name: 'Personal', colorHex: '#16A34A' } } })
  @ApiResponse({ status: 409, description: 'Category name already exists' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({ name: 'id', format: 'uuid', example: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67' })
  @ApiResponse({ status: 204, description: 'Category deleted' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.categoriesService.remove(user.sub, id);
  }
}
