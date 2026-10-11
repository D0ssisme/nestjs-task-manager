import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto.js';
import { TagsService } from './tags.service.js';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post('user/:userId')
  create(@Param('userId') userId: string, @Body() dto: CreateTagDto) {
    return this.tagsService.create(userId, dto);
  }

  @Get('user/:userId')
  findAll(@Param('userId') userId: string) {
    return this.tagsService.findAll(userId);
  }

  @Get('user/:userId/:id')
  findOne(@Param('userId') userId: string, @Param('id') id: string) {
    return this.tagsService.findOne(userId, id);
  }

  @Patch('user/:userId/:id')
  update(@Param('userId') userId: string, @Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.tagsService.update(userId, id, dto);
  }

  @Delete('user/:userId/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('userId') userId: string, @Param('id') id: string): Promise<void> {
    await this.tagsService.remove(userId, id);
  }
}
