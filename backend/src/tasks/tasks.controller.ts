import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto.js';
import { TasksService } from './tasks.service.js';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('user/:userId')
  create(@Param('userId') userId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(userId, dto);
  }

  @Get('user/:userId')
  findAll(@Param('userId') userId: string, @Query('status') status?: TaskStatus) {
    return this.tasksService.findAll(userId, status);
  }

  @Get('user/:userId/:id')
  findOne(@Param('userId') userId: string, @Param('id') id: string) {
    return this.tasksService.findOne(userId, id);
  }

  @Patch('user/:userId/:id')
  update(@Param('userId') userId: string, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(userId, id, dto);
  }

  @Delete('user/:userId/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('userId') userId: string, @Param('id') id: string): Promise<void> {
    await this.tasksService.remove(userId, id);
  }
}
