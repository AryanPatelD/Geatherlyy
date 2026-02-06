import { Controller, Get, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import * as crypto from 'crypto';

const decrypt = (text: string) => {
  if (!process.env.PRIVATE_KEY) return text;
  try {
    const buffer = Buffer.from(text, 'base64');
    const privateKey = Buffer.from(process.env.PRIVATE_KEY, 'base64');
    
    // Decrypt using native module with OAEP padding (required for Node 22+ / OpenSSL 3 private decryption)
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer,
    );
    return decrypted.toString('utf8');
  } catch (e) {
    console.error('Decryption failed:', e.message);
    // On error, return text or throw. 
    // If it's not base64 or decryption fails, we'll assume it's plaintext for debugging or fallback.
    return text;
  }
};

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
    console.log('Login attempt for:', loginDto.email);
    const decryptedPassword = decrypt(loginDto.password);
    console.log('Decryption result (length):', decryptedPassword.length);
    console.log('Is decrypted same as original?', decryptedPassword === loginDto.password);
    
    try {
      const user = await this.authService.validateUser(loginDto.email, decryptedPassword);
      return this.authService.login(user);
    } catch (error) {
      console.error('ValidateUser failed:', error.message);
      throw error;
    }
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
    const frontendUrl = process.env.FRONTEND_URL || 'https://getherlyy.vercel.app';
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


