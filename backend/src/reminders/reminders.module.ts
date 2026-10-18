import { Module } from '@nestjs/common';
import { RemindersService } from './reminders.service.js';
import { RemindersController } from './reminders.controller.js';

@Module({
  controllers: [RemindersController],
  providers: [RemindersService],
})
export class RemindersModule {}
