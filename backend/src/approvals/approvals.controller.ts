import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, ApprovalStatus } from '@prisma/client';

@ApiTags('approvals')
@Controller('approvals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) { }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all approval requests (Faculty/Admin only - Faculty only sees clubs they mentor or convene)' })
  @ApiResponse({ status: 200, description: 'Returns list of approval requests' })
  async getAllRequests(
    @Query('status') status?: ApprovalStatus,
    @Query('requestedRole') requestedRole?: UserRole,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Request() req?,
  ) {
    const isAdmin = req?.user?.role === UserRole.ADMIN;
    return this.approvalsService.findAll({
      status,
      requestedRole,
      skip: skip ? parseInt(skip.toString()) : undefined,
      take: take ? parseInt(take.toString()) : undefined,
      facultyUserId: req?.user?.id,
      isAdmin,
    });
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get pending approval requests (Faculty/Admin only - Faculty only sees clubs they mentor or convene)' })
  @ApiResponse({ status: 200, description: 'Returns pending requests' })
  async getPendingRequests(@Request() req) {
    const isAdmin = req?.user?.role === UserRole.ADMIN;
    return this.approvalsService.getPendingRequests(req?.user?.id, isAdmin);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get approval statistics (Faculty/Admin only - Faculty only sees stats for clubs they mentor or convene)' })
  @ApiResponse({ status: 200, description: 'Returns approval statistics' })
  async getApprovalStats(@Request() req) {
    const isAdmin = req?.user?.role === UserRole.ADMIN;
    return this.approvalsService.getApprovalStats(req?.user?.id, isAdmin);
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Get current user\'s approval requests' })
  @ApiResponse({ status: 200, description: 'Returns user requests' })
  async getMyRequests(@Request() req) {
    return this.approvalsService.getUserRequests(req.user.id);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get approval request by ID (Faculty/Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns approval request details' })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  async getRequestById(@Param('id', ParseIntPipe) id: number) {
    return this.approvalsService.findById(id);
  }

  @Post('request')
  @ApiOperation({ summary: 'Request role change' })
  @ApiResponse({ status: 201, description: 'Role change request submitted successfully' })
  async requestRoleChange(
    @Body('requestedRole') requestedRole: UserRole,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.approvalsService.requestRoleChange(req.user.id, requestedRole, reason);
  }

  @Post('request-coordinator/:clubId')
  @ApiOperation({ summary: 'Request to be coordinator for a specific club' })
  @ApiResponse({ status: 201, description: 'Coordinator request submitted successfully' })
  async requestCoordinatorRole(
    @Param('clubId', ParseIntPipe) clubId: number,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.approvalsService.requestCoordinatorRole(req.user.id, clubId, reason);
  }


  @Put(':id/review')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Review approval request (Faculty can only review for clubs they mentor or convene)' })
  @ApiResponse({ status: 200, description: 'Request reviewed successfully' })
  @ApiResponse({ status: 403, description: 'Faculty can only review requests for clubs they mentor or convene' })
  async reviewRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ApprovalStatus,
    @Request() req,
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.approvalsService.reviewRequest(id, req.user.id, status, isAdmin);
  }
}


