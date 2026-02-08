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
  Res,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ClubsService } from './clubs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('clubs')
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) { }

  @Get()
  @ApiOperation({ summary: 'Get all clubs' })
  @ApiResponse({ status: 200, description: 'Returns list of clubs' })
  async getAllClubs(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.clubsService.findAll({
      category,
      search,
      skip: skip ? parseInt(skip.toString()) : undefined,
      take: take ? parseInt(take.toString()) : undefined,
    });
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all unique club categories' })
  @ApiResponse({ status: 200, description: 'Returns list of categories' })
  async getCategories() {
    return this.clubsService.getCategories();
  }

  @Get('managed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get clubs managed by current user' })
  @ApiResponse({ status: 200, description: 'Returns managed clubs' })
  async getManagedClubs(@Request() req) {
    return this.clubsService.findManagedByUser(req.user.id);
  }

  @Get('my-clubs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get clubs the current user is a member of' })
  @ApiResponse({ status: 200, description: 'Returns user clubs' })
  async getMyClubs(@Request() req) {
    return this.clubsService.findUserClubs(req.user.id);
  }

  @Get('pending-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get clubs with pending join requests for the current user' })
  @ApiResponse({ status: 200, description: 'Returns pending club requests' })
  async getPendingRequests(@Request() req) {
    // For now, return empty array as we need to implement club join approval system
    return [];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get club by ID' })
  @ApiResponse({ status: 200, description: 'Returns club details' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  async getClubById(@Param('id', ParseIntPipe) id: number) {
    return this.clubsService.findById(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get club statistics' })
  @ApiResponse({ status: 200, description: 'Returns club statistics' })
  async getClubStats(@Param('id', ParseIntPipe) id: number) {
    return this.clubsService.getClubStats(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'clubPhoto', maxCount: 1 },
      { name: 'eventPhotos', maxCount: 5 },
    ]),
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new club (Faculty/Admin only)' })
  @ApiResponse({ status: 201, description: 'Club created successfully' })
  async createClub(
    @Body() createData: any,
    @UploadedFiles() files: { clubPhoto?: Express.Multer.File[]; eventPhotos?: Express.Multer.File[] },
    @Request() req,
  ) {
    return this.clubsService.create(createData, req.user.id, files);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR, UserRole.FACULTY, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update club (Coordinator/Faculty/Admin only)' })
  @ApiResponse({ status: 200, description: 'Club updated successfully' })
  async updateClub(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: any,
    @Request() req,
  ) {
    return this.clubsService.update(id, updateData, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete club (Admin only)' })
  @ApiResponse({ status: 204, description: 'Club deleted successfully' })
  async deleteClub(@Param('id', ParseIntPipe) id: number) {
    await this.clubsService.delete(id);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a club' })
  @ApiResponse({ status: 200, description: 'Successfully joined the club' })
  async joinClub(@Param('id', ParseIntPipe) id: number, @Request() req) {
    await this.clubsService.joinClub(id, req.user.id);
    return { message: 'Successfully joined the club' };
  }

  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a club' })
  @ApiResponse({ status: 200, description: 'Successfully left the club' })
  async leaveClub(@Param('id', ParseIntPipe) id: number, @Request() req) {
    await this.clubsService.leaveClub(id, req.user.id);
    return { message: 'Successfully left the club' };
  }

  @Post(':id/coordinators')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add coordinator to club (Faculty/Admin only)' })
  @ApiResponse({ status: 200, description: 'Coordinator added successfully' })
  async addCoordinator(
    @Param('id', ParseIntPipe) clubId: number,
    @Body('userId') userId: number,
    @Request() req,
  ) {
    await this.clubsService.addCoordinator(clubId, userId, req.user.id);
    return { message: 'Coordinator added successfully' };
  }

  @Post(':id/apply-coordinator')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply to be a coordinator for a club' })
  @ApiResponse({ status: 200, description: 'Application submitted successfully' })
  async applyAsCoordinator(
    @Param('id', ParseIntPipe) clubId: number,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    await this.clubsService.applyAsCoordinator(clubId, req.user.id, reason);
    return { message: 'Application submitted successfully. Awaiting approval from faculty or admin.' };
  }

  @Delete(':id/coordinators/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove coordinator from club (Faculty/Admin only)' })
  @ApiResponse({ status: 204, description: 'Coordinator removed successfully' })
  async removeCoordinator(
    @Param('id', ParseIntPipe) clubId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req,
  ) {
    await this.clubsService.removeCoordinator(clubId, userId, req.user.id);
  }

  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MEMBER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove member from club (Faculty/Admin/Coordinator)' })
  @ApiResponse({ status: 200, description: 'Member removed or removal requested' })
  async removeMember(
    @Param('id', ParseIntPipe) clubId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Request() req,
  ) {
    return this.clubsService.removeMember(clubId, userId, req.user.id);
  }

  @Get(':id/members/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR, UserRole.FACULTY, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export club members to Excel' })
  @ApiResponse({ status: 200, description: 'Excel file generated successfully' })
  async exportMembers(@Param('id', ParseIntPipe) id: number, @Request() req, @Res() res) {
    const buffer = await this.clubsService.exportMembersToExcel(id, req.user.id);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=club-members-${id}.xlsx`);
    res.send(buffer);
  }
}


