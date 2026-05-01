import { Controller, Post, Body, Get, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: any) {
    try {
      const result = await this.authService.register(registerDto);
      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    const result = await this.authService.login(loginDto.email, loginDto.password);
    if (!result) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    return req.user;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req: any) {
    return { message: 'Logged out successfully' };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Request() req: any, @Body() body: { oldPassword: string; newPassword: string }) {
    return this.authService.changePassword(req.user.id, body.oldPassword, body.newPassword);
  }

  @Post('password-reset')
  async requestPasswordReset(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Post('update-profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req: any, @Body() updateDto: any) {
    return this.authService.updateProfile(req.user.id, updateDto);
  }
}