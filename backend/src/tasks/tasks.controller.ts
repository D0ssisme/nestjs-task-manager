import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AttachTagDto, CreateTaskDto, ListTasksQueryDto, UpdateTaskDto } from './dto/task.dto.js';
import { TasksService } from './tasks.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiTags('tasks')
@ApiBearerAuth('access-token')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.sub, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListTasksQueryDto) {
    return this.tasksService.findAll(user.sub, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.tasksService.findOne(user.sub, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(user.sub, id, dto);
  }

  @Post(':id/tags')
  attachTag(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: AttachTagDto) {
    return this.tasksService.attachTag(user.sub, id, dto.tagId);
  }

  @Delete(':id/tags/:tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async detachTag(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('tagId') tagId: string): Promise<void> {
    await this.tasksService.detachTag(user.sub, id, tagId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.tasksService.remove(user.sub, id);
  }
}
