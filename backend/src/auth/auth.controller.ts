import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { ApiErrorResponseDto } from '../common/dto/api-error.dto.js';
import { UserResponseDto } from '../common/dto/user-response.dto.js';
import type { JwtPayload } from './interfaces/jwt-payload.interface.js';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new account' })
  @ApiCreatedResponse({
    description: 'Account created and access token issued',
    type: AuthResponseDto,
    example: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: {
        id: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67',
        email: 'alice@example.com',
        fullName: 'Alice Nguyen',
        timezone: 'Asia/Ho_Chi_Minh',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Request validation failed', type: ApiErrorResponseDto })
  @ApiConflictResponse({ description: 'Email is already registered', type: ApiErrorResponseDto })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiCreatedResponse({
    description: 'Access token issued',
    type: AuthResponseDto,
    example: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: {
        id: '7f6d2e1a-8d5b-4c77-9f35-9a51-8d5e7c3b1f20',
        email: 'alice@example.com',
        fullName: 'Alice Nguyen',
        timezone: 'Asia/Ho_Chi_Minh',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Request validation failed', type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password', type: ApiErrorResponseDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiOkResponse({
    description: 'Current user profile',
    type: UserResponseDto,
    example: {
      id: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67',
      email: 'alice@example.com',
      fullName: 'Alice Nguyen',
      timezone: 'Asia/Ho_Chi_Minh',
      createdAt: '2026-10-13T09:00:00.000Z',
      updatedAt: '2026-10-13T09:00:00.000Z',
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token', type: ApiErrorResponseDto })
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user);
  }
}
