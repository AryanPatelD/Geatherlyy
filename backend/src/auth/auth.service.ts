import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MailerService } from '../common/mailer/mailer.service';
import { NotificationService } from '../common/notifications/notification.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private notificationService: NotificationService,
  ) { }

  async register(registerDto: { email: string; password: string; name: string; universityId?: string; department: string; year?: string; phone?: string }) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    if (registerDto.universityId) {
      const existingUniId = await this.usersService.findByUniversityId(registerDto.universityId);
      if (existingUniId) {
        throw new ConflictException('User with this University ID already exists');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      universityId: registerDto.universityId,
      department: registerDto.department,
      year: registerDto.year,
      phone: registerDto.phone,
      profileComplete: true,
    });

    return this.login(user);
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      console.log('User not found:', email);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user signed up with Google (no password)
    if (!user.password && user.googleId) {
      console.log('User has googleId but no password');
      throw new UnauthorizedException('This account uses Google Sign-In. Please use "Continue with Google" button.');
    }

    if (!user.password) {
      console.log('User has no password');
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Password mismatch for user:', email);
      console.log('Provided (decrypted) password:', password); // Be careful with logs in prod
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    return user;
  }

  async validateGoogleUser(profile: any) {
    const { id, emails, displayName, photos } = profile;
    const email = emails[0].value;

    // Check if user exists by email
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      // Check if user exists by Google ID
      user = await this.usersService.findByGoogleId(id);
    }

    if (!user) {
      // Create new user with a unique temporary universityId using email
      user = await this.usersService.create({
        email,
        googleId: id,
        name: displayName,
        avatar: photos?.[0]?.value,
        universityId: `temp_${id}`, // Temporary unique ID to be filled in profile completion
        department: '',
        profileComplete: false,
      });
    } else {
      // Update existing user's Google info if needed
      if (!user.googleId) {
        user = await this.usersService.update(user.id, {
          googleId: id,
          avatar: photos?.[0]?.value || user.avatar,
        });
      }
      // Update last login
      await this.usersService.updateLastLogin(user.id);
    }

    return user;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        universityId: user.universityId,
        department: user.department,
        year: user.year,
        phone: user.phone,
        role: user.role,
        profileComplete: user.profileComplete,
        approvalStatus: user.approvalStatus,
        mustChangePassword: user.mustChangePassword,
        avatar: user.avatar,
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return { message: 'If a user with this email exists, a password reset link has been sent.' };
    }

    if (!user.password && user.googleId) {
       // Optional: Send email saying they use Google Login
       return { message: 'If a user with this email exists, a password reset link has been sent.' };
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(token, 10);
    const expires = new Date(Date.now() + 3600000); // 1 hour

    console.log(`[ForgotPassword] Generated token for ${email} (first 10 chars): ${token.substring(0, 10)}...`);
    console.log(`[ForgotPassword] Token length: ${token.length}`);
    console.log(`[ForgotPassword] Hashed token length: ${hashedToken.length}`);
    console.log(`[ForgotPassword] Expires at: ${expires.toISOString()}`);

    // Save to user
    await this.usersService.update(user.id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: expires,
    });

    // Send styled email using NotificationService
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    
    console.log(`[ForgotPassword] Reset URL: ${resetUrl}`);
    
    await this.notificationService.sendPasswordResetEmail({
      userName: user.name,
      userEmail: email,
      resetUrl: resetUrl,
      expiresInHours: 1,
    });

    return { message: 'If a user with this email exists, a password reset link has been sent.' };
  }

  async resetPassword(token: string, email: string, newPassword: string) {
    // URL decode the email in case it was encoded
    const decodedEmail = decodeURIComponent(email);
    console.log(`[ResetPassword] Attempting password reset for email: ${decodedEmail}`);
    console.log(`[ResetPassword] Token received (first 10 chars): ${token?.substring(0, 10)}...`);
    
    const user = await this.usersService.findByEmail(decodedEmail);
    if (!user) {
      console.log(`[ResetPassword] User not found for email: ${decodedEmail}`);
      throw new UnauthorizedException('Invalid or expired token.');
    }
    
    if (!user.resetPasswordToken || !user.resetPasswordExpires) {
      console.log(`[ResetPassword] No reset token found for user: ${decodedEmail}`);
      console.log(`[ResetPassword] Token in DB: ${user.resetPasswordToken ? 'exists' : 'null'}`);
      console.log(`[ResetPassword] Expires in DB: ${user.resetPasswordExpires ? user.resetPasswordExpires.toISOString() : 'null'}`);
      throw new UnauthorizedException('Invalid or expired token.');
    }

    // Check if expired
    if (new Date() > user.resetPasswordExpires) {
      console.log(`[ResetPassword] Token expired for user: ${decodedEmail}`);
      console.log(`[ResetPassword] Expired at: ${user.resetPasswordExpires.toISOString()}, Now: ${new Date().toISOString()}`);
      throw new UnauthorizedException('Token has expired.');
    }

    // Compare the incoming clear text token with the stored hash
    console.log(`[ResetPassword] Comparing token...`);
    console.log(`[ResetPassword] Token length: ${token?.length}, Stored hash length: ${user.resetPasswordToken?.length}`);
    
    const isTokenValid = await bcrypt.compare(token, user.resetPasswordToken);
    
    if (!isTokenValid) {
      console.log(`[ResetPassword] Invalid token for user: ${decodedEmail}`);
      throw new UnauthorizedException('Invalid token.');
    }

    console.log(`[ResetPassword] Token validated, updating password for user: ${decodedEmail}`);
    
    // Update user (UsersService handles hashing)
    const updatedUser = await this.usersService.update(user.id, {
      password: newPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      mustChangePassword: false
    });

    console.log(`[ResetPassword] Password updated successfully for user: ${email}, userId: ${updatedUser.id}`);

    return { message: 'Password has been reset successfully.' };
  }

  async validateJwtPayload(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    return user;
  }

  async refreshToken(userId: number) {
    const user = await this.usersService.findById(userId);
    return this.login(user);
  }

  async changePassword(userId: number, newPassword: string) {
    // UsersService handles hashing
    await this.usersService.update(userId, {
      password: newPassword,
      mustChangePassword: false,
    });
    return { message: 'Password changed successfully' };
  }
}


