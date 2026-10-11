import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.usersService.findByEmail(email)) {
      throw new ConflictException('Email is already registered');
    }

    const user = await this.usersService.create({
      email,
      passwordHash: await bcrypt.hash(dto.password, 12),
      fullName: dto.fullName?.trim(),
    });
    return this.createAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email.trim().toLowerCase());
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.createAuthResponse(user);
  }

  private async createAuthResponse(user: { id: string; email: string; fullName: string | null; timezone: string }) {
    const accessToken = await this.jwtService.signAsync({ sub: user.id, email: user.email });
    return {
      accessToken,
      user: { id: user.id, email: user.email, fullName: user.fullName, timezone: user.timezone },
    };
  }
}
