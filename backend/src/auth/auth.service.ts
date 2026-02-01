import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
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
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user signed up with Google (no password)
    if (!user.password && user.googleId) {
      throw new UnauthorizedException('This account uses Google Sign-In. Please use "Continue with Google" button.');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
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
        avatar: user.avatar,
      },
    };
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
}


