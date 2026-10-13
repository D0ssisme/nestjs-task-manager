import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a task' })
  @ApiResponse({ status: 201, description: 'Task created' })
  @ApiResponse({ status: 400, description: 'Invalid task data or relation ownership' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List tasks with filtering, pagination and sorting' })
  @ApiResponse({ status: 200, description: 'Paginated task list', schema: { example: { data: [{ id: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67', title: 'Prepare presentation', status: 'TODO', priority: 'HIGH', completedAt: null }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } } } })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListTasksQueryDto) {
    return this.tasksService.findAll(user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiParam({ name: 'id', format: 'uuid', example: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67' })
  @ApiResponse({ status: 200, description: 'Task details' })
  @ApiResponse({ status: 404, description: 'Task not found or not owned by current user' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.tasksService.findOne(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id', format: 'uuid', example: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67' })
  @ApiResponse({ status: 200, description: 'Task updated' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(user.sub, id, dto);
  }

  @Post(':id/tags')
  @ApiOperation({ summary: 'Attach a tag to a task' })
  @ApiParam({ name: 'id', format: 'uuid', example: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67' })
  @ApiResponse({ status: 201, description: 'Tag attached to task' })
  @ApiResponse({ status: 409, description: 'Tag is already attached' })
  attachTag(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: AttachTagDto) {
    return this.tasksService.attachTag(user.sub, id, dto.tagId);
  }

  @Delete(':id/tags/:tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Detach a tag from a task' })
  @ApiParam({ name: 'id', format: 'uuid', example: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67' })
  @ApiParam({ name: 'tagId', format: 'uuid', example: 'a1b2c3d4-e5f6-4789-abcd-1234567890ab' })
  @ApiResponse({ status: 204, description: 'Tag detached' })
  @ApiResponse({ status: 404, description: 'Task or tag relation not found' })
  async detachTag(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('tagId') tagId: string): Promise<void> {
    await this.tasksService.detachTag(user.sub, id, tagId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', format: 'uuid', example: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67' })
  @ApiResponse({ status: 204, description: 'Task deleted' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.tasksService.remove(user.sub, id);
  }
}
