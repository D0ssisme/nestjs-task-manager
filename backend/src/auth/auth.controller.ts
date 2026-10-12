import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { JwtPayload } from './interfaces/jwt-payload.interface.js';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new account' })
  @ApiResponse({ status: 201, description: 'Account created and access token issued', schema: { example: { accessToken: 'eyJhbGciOiJIUzI1NiIs...', user: { id: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67', email: 'alice@example.com', fullName: 'Alice Nguyen' } } } })
  @ApiResponse({ status: 409, description: 'Email is already registered', schema: { example: { statusCode: 409, message: 'Email already exists' } } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 201, description: 'Access token issued', schema: { example: { accessToken: 'eyJhbGciOiJIUzI1NiIs...', user: { id: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67', email: 'alice@example.com' } } } })
  @ApiResponse({ status: 401, description: 'Invalid credentials', schema: { example: { statusCode: 401, message: 'Invalid credentials' } } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user profile', schema: { example: { id: '7f6d2e1a-8d5b-4c77-9f35-9a0b1d4e5f67', email: 'alice@example.com', fullName: 'Alice Nguyen', timezone: 'Asia/Ho_Chi_Minh' } } })
  @ApiResponse({ status: 400, description: 'Request validation failed', schema: { example: { statusCode: 400, message: ['email must be an email'] } } })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token', schema: { example: { statusCode: 401, message: 'Unauthorized' } } })
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user);
  }
}
