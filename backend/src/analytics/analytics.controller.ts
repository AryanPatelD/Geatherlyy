import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('public-stats')
  @ApiOperation({ summary: 'Get public platform stats for landing page (no auth required)' })
  async getPublicStats() {
    return this.analyticsService.getPublicStats();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform analytics (Faculty/Admin only)' })
  async getAnalytics(@Req() req) {
    return this.analyticsService.getPlatformAnalytics(req.user.id, req.user.role);
  }
}
