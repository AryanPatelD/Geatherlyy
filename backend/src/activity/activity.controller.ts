
import { Controller, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('activity')
@Controller('activity')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('logs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get activity logs (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns list of activity logs' })
  async getLogs(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.activityService.getLogs(
      skip ? parseInt(skip.toString()) : 0,
      take ? parseInt(take.toString()) : 50,
    );
  }
}
