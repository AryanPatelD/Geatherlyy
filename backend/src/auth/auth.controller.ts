import { Controller, Get, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  async resetPassword(@Body() body: { token: string; email: string; password: string }) {
    return this.authService.resetPassword(body.token, body.email, body.password);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register with email and password' })
  async register(
    @Body() registerDto: { 
      email: string; 
      password: string; 
      name: string; 
      universityId: string; 
      department: string;
      year?: string;
      phone?: string;
    },
  ) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(
    @Body() loginDto: { email: string; password: string },
  ) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    return this.authService.login(user);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    const { access_token, user } = await this.authService.login(req.user);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'https://geatherlyy.vercel.app';
    res.redirect(
      `${frontendUrl}/auth/callback?token=${access_token}&profileComplete=${user.profileComplete}`,
    );
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user' })
  async getCurrentUser(@Req() req) {
    return req.user;
  }

  @Get('refresh')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Refresh JWT token' })
  async refreshToken(@Req() req) {
    return this.authService.refreshToken(req.user.id);
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Change password' })
  async changePassword(@Req() req, @Body() body: { password: string }) {
    return this.authService.changePassword(req.user.id, body.password);
  }
}


