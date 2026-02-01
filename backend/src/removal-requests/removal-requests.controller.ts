import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RemovalRequestsService } from './removal-requests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, RemovalApprovalStatus } from '@prisma/client';

@ApiTags('removal-requests')
@Controller('removal-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RemovalRequestsController {
  constructor(private readonly service: RemovalRequestsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Request to remove a member (Coordinator only)' })
  async createRequest(
    @Request() req,
    @Body() body: { clubId: number; memberId: number; reason: string }
  ) {
    return this.service.create(req.user.id, body);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all removal requests (Faculty/Admin only)' })
  async getAllRequests(@Query('status') status?: RemovalApprovalStatus) {
    return this.service.findAll({ status });
  }

  @Put(':id/review')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve or Reject removal request' })
  async reviewRequest(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: RemovalApprovalStatus
  ) {
    return this.service.review(id, req.user.id, status, req.user.role);
  }
}
