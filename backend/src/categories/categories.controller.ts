import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto.js';
import { CategoryResponseDto } from './dto/category-response.dto.js';
import { CategoriesService } from './categories.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiErrorResponseDto } from '../common/dto/api-error.dto.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

const categoryExample = {
  id: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67',
  userId: '11111111-1111-4111-8111-111111111111',
  name: 'Work',
  colorHex: '#2563EB',
  icon: 'briefcase',
  createdAt: '2026-10-13T09:00:00.000Z',
  updatedAt: '2026-10-13T09:00:00.000Z',
};

@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiTags('categories')
@ApiBearerAuth('access-token')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  @ApiCreatedResponse({ description: 'Category created', type: CategoryResponseDto, example: categoryExample })
  @ApiBadRequestResponse({ description: 'Request validation failed', type: ApiErrorResponseDto })
  @ApiConflictResponse({ description: 'Category name already exists', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List current user categories' })
  @ApiOkResponse({ description: 'Category list returned', type: [CategoryResponseDto], example: [categoryExample] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.categoriesService.findAll(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiParam({ name: 'id', format: 'uuid', example: categoryExample.id })
  @ApiOkResponse({ description: 'Category details', type: CategoryResponseDto, example: categoryExample })
  @ApiNotFoundResponse({ description: 'Category not found', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.categoriesService.findOne(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', format: 'uuid', example: categoryExample.id })
  @ApiOkResponse({ description: 'Category updated', type: CategoryResponseDto, example: { ...categoryExample, name: 'Personal', colorHex: '#16A34A', icon: 'home' } })
  @ApiBadRequestResponse({ description: 'Request validation failed', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Category not found', type: ApiErrorResponseDto })
  @ApiConflictResponse({ description: 'Category name already exists', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({ name: 'id', format: 'uuid', example: categoryExample.id })
  @ApiNoContentResponse({ description: 'Category deleted' })
  @ApiNotFoundResponse({ description: 'Category not found', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.categoriesService.remove(user.sub, id);
  }
}
