import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';
import { RemindersService } from './reminders.service.js';

@Controller('reminders')
@UseGuards(JwtAuthGuard)
@ApiTags('reminders')
@ApiBearerAuth('access-token')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  @ApiOperation({ summary: 'List overdue and upcoming task notifications' })
  @ApiResponse({ status: 200, description: 'Notifications for tasks due within the next 24 hours' })
  findForUser(@CurrentUser() user: JwtPayload) {
    return this.remindersService.findForUser(user.sub);
  }
}
