import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, ActivityType, ActivityStatus } from '@prisma/client';

@ApiTags('activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all activities' })
  @ApiResponse({ status: 200, description: 'Returns list of activities' })
  async getAllActivities(
    @Query('clubId') clubId?: string,
    @Query('type') type?: ActivityType,
    @Query('status') status?: ActivityStatus,
    @Query('upcoming') upcoming?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.activitiesService.findAll({
      clubId: clubId ? parseInt(clubId) : undefined,
      type,
      status,
      upcoming: upcoming === 'true',
      skip: skip ? parseInt(skip.toString()) : undefined,
      take: take ? parseInt(take.toString()) : undefined,
    });
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming activities' })
  @ApiResponse({ status: 200, description: 'Returns upcoming activities' })
  async getUpcomingActivities(@Query('limit') limit?: number) {
    return this.activitiesService.getUpcomingActivities(limit);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR, UserRole.FACULTY, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get activity statistics (Coordinator/Faculty/Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns activity statistics' })
  async getActivityStats() {
    return this.activitiesService.getActivityStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get activity by ID' })
  @ApiResponse({ status: 200, description: 'Returns activity details' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async getActivityById(@Param('id', ParseIntPipe) id: number) {
    return this.activitiesService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new activity (Club Members/Coordinators/Admin)' })
  @ApiResponse({ status: 201, description: 'Activity created successfully' })
  async createActivity(@Body() createData: any, @Request() req) {
    // Check if user is allowed to create activity for this club (Member or above)
    const canCreate = await this.activitiesService.canUserCreateActivity(req.user.id, createData.clubId);
    if (!canCreate) {
        throw new ForbiddenException('You must be a member of the club to create activities');
    }

    // Transform the incoming data to match Prisma's expected format
    const activityData = {
      title: createData.title,
      description: createData.description,
      startDate: new Date(createData.startDate),
      location: createData.location,
      type: createData.activityType as ActivityType,
      status: ActivityStatus.UPCOMING,
      club: {
        connect: { id: createData.clubId }
      }
    };
    
    return this.activitiesService.create(activityData);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update activity' })
  @ApiResponse({ status: 200, description: 'Activity updated successfully' })
  async updateActivity(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: any,
    @Request() req,
  ) {
    const canModify = await this.activitiesService.canUserModifyActivity(id, req.user.id);
    
    if (!canModify) {
      throw new ForbiddenException('You do not have permission to modify this activity');
    }

    return this.activitiesService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete activity' })
  @ApiResponse({ status: 204, description: 'Activity deleted successfully' })
  async deleteActivity(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const canModify = await this.activitiesService.canUserModifyActivity(id, req.user.id);
    
    if (!canModify) {
      throw new ForbiddenException('You do not have permission to delete this activity');
    }

    await this.activitiesService.delete(id);
  }
}


