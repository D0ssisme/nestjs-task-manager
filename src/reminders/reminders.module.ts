import { Module } from '@nestjs/common';
import { RemindersService } from './reminders.service.js';

@Module({
  providers: [RemindersService]
})
export class RemindersModule {}
