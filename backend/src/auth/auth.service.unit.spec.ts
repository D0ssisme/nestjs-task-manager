import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: Mock;
    create: Mock;
    findOne: Mock;
  };
  let jwtService: { signAsync: Mock };

  beforeEach(() => {
    usersService = {
      findByEmail: vi.fn(),
      create: vi.fn(),
      findOne: vi.fn(),
    };
    jwtService = { signAsync: vi.fn().mockResolvedValue('test-token') };
    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
    );
  });

  it('throws ConflictException when registering an existing email', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 'existing-user' });

    await expect(service.register({
      email: 'USER@example.com',
      password: 'Strong@12345',
    })).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws UnauthorizedException for invalid login credentials', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(service.login({
      email: 'USER@example.com',
      password: 'wrong-password',
    })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('loads the authenticated user profile from the JWT subject', async () => {
    const profile = { id: 'user-1', email: 'user@example.com' };
    usersService.findOne.mockResolvedValue(profile);

    await expect(service.getProfile({ sub: 'user-1', email: profile.email }))
      .resolves.toBe(profile);
    expect(usersService.findOne).toHaveBeenCalledWith('user-1');
  });
});
