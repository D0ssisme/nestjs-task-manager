import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AttachTagDto, CreateTaskDto, ListTasksQueryDto, UpdateTaskDto } from './dto/task.dto.js';
import { TaskListResponseDto, TaskResponseDto } from './dto/task-response.dto.js';
import { TasksService } from './tasks.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiErrorResponseDto } from '../common/dto/api-error.dto.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

const taskIdExample = '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67';
const tagIdExample = 'a1b2c3d4-e5f6-4789-abcd-1234567890ab';
const taskExample = {
  id: taskIdExample,
  userId: '11111111-1111-4111-8111-111111111111',
  categoryId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  parentId: null,
  title: 'Prepare project presentation',
  description: 'Finish slides and rehearse the demo',
  status: 'TODO',
  priority: 'HIGH',
  dueAt: '2026-10-20T09:00:00.000Z',
  completedAt: null,
  createdAt: '2026-10-13T09:00:00.000Z',
  updatedAt: '2026-10-13T09:00:00.000Z',
  category: null,
  taskTags: [],
};

@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiTags('tasks')
@ApiBearerAuth('access-token')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a task' })
  @ApiCreatedResponse({ description: 'Task created', type: TaskResponseDto, example: taskExample })
  @ApiBadRequestResponse({ description: 'Invalid task data or relation ownership', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List tasks with filtering, pagination and sorting' })
  @ApiQuery({ name: 'status', required: false, enum: ['TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @ApiQuery({ name: 'categoryId', required: false, format: 'uuid', example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, minimum: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, minimum: 1 })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['dueAt', 'createdAt'], example: 'createdAt' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], example: 'desc' })
  @ApiOkResponse({
    description: 'Paginated task list',
    type: TaskListResponseDto,
    example: { data: [taskExample], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } },
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListTasksQueryDto) {
    return this.tasksService.findAll(user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiParam({ name: 'id', format: 'uuid', example: taskIdExample })
  @ApiOkResponse({ description: 'Task details', type: TaskResponseDto, example: taskExample })
  @ApiNotFoundResponse({ description: 'Task not found or not owned by current user', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.tasksService.findOne(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id', format: 'uuid', example: taskIdExample })
  @ApiOkResponse({ description: 'Task updated', type: TaskResponseDto, example: { ...taskExample, title: 'Prepare final project presentation', status: 'DONE', completedAt: '2026-10-13T10:00:00.000Z' } })
  @ApiBadRequestResponse({ description: 'Invalid task data or relation ownership', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Task not found', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(user.sub, id, dto);
  }

  @Post(':id/tags')
  @ApiOperation({ summary: 'Attach a tag to a task' })
  @ApiParam({ name: 'id', format: 'uuid', example: taskIdExample })
  @ApiCreatedResponse({ description: 'Tag attached to task', type: TaskResponseDto, example: taskExample })
  @ApiBadRequestResponse({ description: 'Tag does not belong to the current user', type: ApiErrorResponseDto })
  @ApiConflictResponse({ description: 'Tag is already attached', type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Task not found', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  attachTag(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: AttachTagDto) {
    return this.tasksService.attachTag(user.sub, id, dto.tagId);
  }

  @Delete(':id/tags/:tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Detach a tag from a task' })
  @ApiParam({ name: 'id', format: 'uuid', example: taskIdExample })
  @ApiParam({ name: 'tagId', format: 'uuid', example: tagIdExample })
  @ApiNoContentResponse({ description: 'Tag detached' })
  @ApiNotFoundResponse({ description: 'Task or tag relation not found', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  async detachTag(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Param('tagId') tagId: string): Promise<void> {
    await this.tasksService.detachTag(user.sub, id, tagId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', format: 'uuid', example: taskIdExample })
  @ApiNoContentResponse({ description: 'Task deleted' })
  @ApiNotFoundResponse({ description: 'Task not found', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.tasksService.remove(user.sub, id);
  }
}
