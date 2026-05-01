import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: any) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        full_name: registerDto.full_name,
        password_hash: hashedPassword,
        role: registerDto.role || 'user',
      },
    });

    const token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      access_token: token,
    };
  }

  async login(loginDto: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      access_token: token,
    };
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, full_name: true, role: true },
    });
  }

  async updateProfile(userId: string, updateDto: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: updateDto,
      select: { id: true, email: true, full_name: true, role: true },
    });
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const token = this.jwtService.sign({
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      });
      return { access_token: token };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(id: string, email: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}