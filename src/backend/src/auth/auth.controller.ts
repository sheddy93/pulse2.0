import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() { email, password }: { email: string; password: string }) {
    return this.authService.login(email, password);
  }

  @Post('logout')
  logout() {
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req) {
    return req.user;
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  refresh(@Request() req) {
    return this.authService.refresh(req.user);
  }

  @Post('password-reset')
  passwordReset(@Body() { email }: { email: string }) {
    return this.authService.requestPasswordReset(email);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Request() req,
    @Body() { oldPassword, newPassword }: { oldPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(req.user.id, oldPassword, newPassword);
  }
}