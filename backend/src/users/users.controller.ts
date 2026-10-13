import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiTags('users')
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned', schema: { example: { id: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67', email: 'alice@example.com', fullName: 'Alice Nguyen', timezone: 'Asia/Ho_Chi_Minh' } } })
  findOne(@CurrentUser() user: JwtPayload) {
    return this.usersService.findOne(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiResponse({ status: 200, description: 'User profile updated', schema: { example: { id: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67', email: 'alice@example.com', fullName: 'Alice Nguyen' } } })
  @ApiResponse({ status: 409, description: 'Email is already in use' })
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.sub, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete the current user account' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  async remove(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.usersService.remove(user.sub);
  }
}
