import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserResponseDto } from '../common/dto/user-response.dto.js';
import { ApiErrorResponseDto } from '../common/dto/api-error.dto.js';
import { UsersService } from './users.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

const userExample = {
  id: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67',
  email: 'alice@example.com',
  fullName: 'Alice Nguyen',
  timezone: 'Asia/Ho_Chi_Minh',
  createdAt: '2026-10-13T09:00:00.000Z',
  updatedAt: '2026-10-13T09:00:00.000Z',
};

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiTags('users')
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiOkResponse({ description: 'User profile returned', type: UserResponseDto, example: userExample })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  findOne(@CurrentUser() user: JwtPayload) {
    return this.usersService.findOne(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiOkResponse({ description: 'User profile updated', type: UserResponseDto, example: userExample })
  @ApiBadRequestResponse({ description: 'Request validation failed', type: ApiErrorResponseDto })
  @ApiConflictResponse({ description: 'Email is already in use', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.sub, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete the current user account' })
  @ApiNoContentResponse({ description: 'User deleted' })
  @ApiNotFoundResponse({ description: 'User not found', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  async remove(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.usersService.remove(user.sub);
  }
}
