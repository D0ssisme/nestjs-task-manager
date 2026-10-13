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
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto.js';
import { TagResponseDto } from './dto/tag-response.dto.js';
import { TagsService } from './tags.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiErrorResponseDto } from '../common/dto/api-error.dto.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

const tagExample = {
  id: 'a1b2c3d4-e5f6-4789-abcd-1234567890ab',
  userId: '11111111-1111-4111-8111-111111111111',
  name: 'urgent',
  colorHex: '#DC2626',
  createdAt: '2026-10-13T09:00:00.000Z',
  updatedAt: '2026-10-13T09:00:00.000Z',
};

@Controller('tags')
@UseGuards(JwtAuthGuard)
@ApiTags('tags')
@ApiBearerAuth('access-token')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a tag' })
  @ApiCreatedResponse({ description: 'Tag created', type: TagResponseDto, example: tagExample })
  @ApiBadRequestResponse({ description: 'Request validation failed', type: ApiErrorResponseDto })
  @ApiConflictResponse({ description: 'Tag name already exists', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTagDto) {
    return this.tagsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List current user tags' })
  @ApiOkResponse({ description: 'Tag list returned', type: [TagResponseDto], example: [tagExample] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.tagsService.findAll(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tag by ID' })
  @ApiParam({ name: 'id', format: 'uuid', example: tagExample.id })
  @ApiOkResponse({ description: 'Tag details', type: TagResponseDto, example: tagExample })
  @ApiNotFoundResponse({ description: 'Tag not found', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.tagsService.findOne(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tag' })
  @ApiParam({ name: 'id', format: 'uuid', example: tagExample.id })
  @ApiOkResponse({ description: 'Tag updated', type: TagResponseDto, example: { ...tagExample, name: 'blocked', colorHex: '#F59E0B' } })
  @ApiBadRequestResponse({ description: 'Request validation failed', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Tag not found', type: ApiErrorResponseDto })
  @ApiConflictResponse({ description: 'Tag name already exists', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.tagsService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a tag' })
  @ApiParam({ name: 'id', format: 'uuid', example: tagExample.id })
  @ApiNoContentResponse({ description: 'Tag deleted' })
  @ApiNotFoundResponse({ description: 'Tag not found', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.tagsService.remove(user.sub, id);
  }
}
