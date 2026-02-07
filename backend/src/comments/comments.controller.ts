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
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR, UserRole.FACULTY, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all comments (Coordinator/Faculty/Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns list of comments' })
  async getAllComments(
    @Query('clubId') clubId?: string,
    @Query('isAnonymous') isAnonymous?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.commentsService.findAll({
      clubId: clubId ? parseInt(clubId) : undefined,
      isAnonymous: isAnonymous === 'true',
      skip: skip ? parseInt(skip.toString()) : undefined,
      take: take ? parseInt(take.toString()) : undefined,
    });
  }

  @Get('club/:clubId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get comments for a specific club (Club members only)' })
  @ApiResponse({ status: 200, description: 'Returns club comments' })
  async getClubComments(
    @Param('clubId', ParseIntPipe) clubId: number,
    @Request() req,
  ) {
    return this.commentsService.getClubComments(clubId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR, UserRole.FACULTY, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get comment by ID' })
  @ApiResponse({ status: 200, description: 'Returns comment details' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async getCommentById(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  async createComment(@Body() createData: { clubId: number; content: string; isAnonymous?: boolean }, @Request() req) {
    const { clubId, ...rest } = createData;
    return this.commentsService.create({
      ...rest,
      isAnonymous: rest.isAnonymous ?? true,
      club: {
        connect: { id: clubId },
      },
      user: {
        connect: { id: req.user.id },
      },
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update comment' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  async updateComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: any,
    @Request() req,
  ) {
    const canModify = await this.commentsService.canUserModifyComment(id, req.user.id);
    
    if (!canModify) {
      throw new ForbiddenException('You do not have permission to modify this comment');
    }

    return this.commentsService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete comment' })
  @ApiResponse({ status: 204, description: 'Comment deleted successfully' })
  async deleteComment(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const canModify = await this.commentsService.canUserModifyComment(id, req.user.id);
    
    if (!canModify) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }

    await this.commentsService.delete(id);
  }
}


