import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto.js';
import { TagsService } from './tags.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@Controller('tags')
@UseGuards(JwtAuthGuard)
@ApiTags('tags')
@ApiBearerAuth('access-token')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a tag' })
  @ApiResponse({ status: 201, description: 'Tag created', schema: { example: { id: 'a1b2c3d4-e5f6-4789-abcd-1234567890ab', name: 'urgent', colorHex: '#DC2626' } } })
  @ApiResponse({ status: 409, description: 'Tag name already exists' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTagDto) {
    return this.tagsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List current user tags' })
  @ApiResponse({ status: 200, description: 'Tag list returned', schema: { example: [{ id: 'a1b2c3d4-e5f6-4789-abcd-1234567890ab', name: 'urgent', colorHex: '#DC2626' }] } })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.tagsService.findAll(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tag by ID' })
  @ApiParam({ name: 'id', format: 'uuid', example: 'a1b2c3d4-e5f6-4789-abcd-1234567890ab' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.tagsService.findOne(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tag' })
  @ApiParam({ name: 'id', format: 'uuid', example: 'a1b2c3d4-e5f6-4789-abcd-1234567890ab' })
  @ApiResponse({ status: 200, description: 'Tag updated', schema: { example: { id: 'a1b2c3d4-e5f6-4789-abcd-1234567890ab', name: 'blocked', colorHex: '#F59E0B' } } })
  @ApiResponse({ status: 409, description: 'Tag name already exists' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.tagsService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a tag' })
  @ApiParam({ name: 'id', format: 'uuid', example: 'a1b2c3d4-e5f6-4789-abcd-1234567890ab' })
  @ApiResponse({ status: 204, description: 'Tag deleted' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.tagsService.remove(user.sub, id);
  }
}
