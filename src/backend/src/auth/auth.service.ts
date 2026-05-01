import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(registerDto: any) {
    const { email, password, full_name, phone, role = 'employee' } = registerDto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        full_name,
        phone,
        role,
        profile_completed: false,
      },
    });

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return null;
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return null;
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        must_change_password: user.must_change_password,
      },
    };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const passwordMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!passwordMatch) {
      throw new Error('Old password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password_hash: newPasswordHash },
    });

    return { message: 'Password changed successfully' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists or not
      return { message: 'If account exists, reset email sent' };
    }

    // TODO: Implement email sending for password reset
    return { message: 'Password reset email sent' };
  }

  async updateProfile(userId: string, updateDto: any) {
    const { full_name, phone, role, profile_completed } = updateDto;
    
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(full_name && { full_name }),
        ...(phone && { phone }),
        ...(role && { role }),
        ...(profile_completed !== undefined && { profile_completed }),
      },
    });

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      profile_completed: user.profile_completed,
    };
  }
}