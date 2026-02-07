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
import { QuizzesService } from './quizzes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('quizzes')
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all quizzes' })
  @ApiResponse({ status: 200, description: 'Returns list of quizzes' })
  async getAllQuizzes(
    @Query('clubId') clubId?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.quizzesService.findAll({
      clubId: clubId ? parseInt(clubId) : undefined,
      skip: skip ? parseInt(skip.toString()) : undefined,
      take: take ? parseInt(take.toString()) : undefined,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quiz by ID' })
  @ApiResponse({ status: 200, description: 'Returns quiz details' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async getQuizById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    // Check if user is coordinator/faculty/admin to show answers
    const user = req.user;
    const includeAnswers = [UserRole.COORDINATOR, UserRole.FACULTY, UserRole.ADMIN].includes(user.role);
    
    return this.quizzesService.findById(id, includeAnswers);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR, UserRole.FACULTY, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get quiz statistics (Coordinator/Faculty/Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns quiz statistics' })
  async getQuizStats(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.quizzesService.getQuizStats(id, req.user.id);
  }

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Get quiz leaderboard' })
  @ApiResponse({ status: 200, description: 'Returns quiz leaderboard' })
  async getQuizLeaderboard(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: number,
  ) {
    return this.quizzesService.getQuizLeaderboard(id, limit);
  }

  @Get(':id/my-attempt')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user\'s attempt for a quiz' })
  @ApiResponse({ status: 200, description: 'Returns user attempt' })
  async getUserAttempt(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.quizzesService.getUserAttempt(id, req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new quiz (Club Members/Coordinators/Admin)' })
  @ApiResponse({ status: 201, description: 'Quiz created successfully' })
  async createQuiz(@Body() createData: any, @Request() req) {
     // Check if user is allowed to create quiz for this club (Member or above)
     const canCreate = await this.quizzesService.canUserCreateQuiz(req.user.id, createData.clubId);
     if (!canCreate) {
         throw new ForbiddenException('You must be a member of the club to create quizzes');
     }

    return this.quizzesService.create(createData, req.user.id);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit quiz attempt' })
  @ApiResponse({ status: 200, description: 'Quiz submitted successfully' })
  async submitQuiz(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { answers: Record<string, number> },
    @Request() req,
  ) {
    console.log(`[QuizSubmit] User ${req.user.id} submitting quiz ${id}`);
    console.log(`[QuizSubmit] Answers received:`, JSON.stringify(body.answers || {}));
    
    const answers = body.answers || {};
    
    // Convert string keys to number keys if needed
    const normalizedAnswers: Record<number, number> = {};
    for (const [key, value] of Object.entries(answers)) {
      normalizedAnswers[parseInt(key)] = value;
    }
    
    console.log(`[QuizSubmit] Normalized answers:`, JSON.stringify(normalizedAnswers));
    
    return this.quizzesService.submitQuizAttempt(id, req.user.id, normalizedAnswers);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update quiz (Creator/Coordinator/Faculty/Admin only)' })
  @ApiResponse({ status: 200, description: 'Quiz updated successfully' })
  async updateQuiz(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: any,
    @Request() req,
  ) {
    return this.quizzesService.update(id, updateData, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete quiz (Creator/Coordinator/Faculty/Admin only)' })
  @ApiResponse({ status: 204, description: 'Quiz deleted successfully' })
  async deleteQuiz(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    await this.quizzesService.delete(id, req.user.id);
  }

  @Post(':id/end')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End a quiz - Sets end date to now and deactivates (Coordinator only)' })
  @ApiResponse({ status: 200, description: 'Quiz ended successfully' })
  @ApiResponse({ status: 403, description: 'Not a coordinator of this club' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async endQuiz(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.quizzesService.endQuiz(id, req.user.id);
  }

  @Post(':id/stop')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stop a quiz - Immediately deactivates the quiz (Coordinator only)' })
  @ApiResponse({ status: 200, description: 'Quiz stopped successfully' })
  @ApiResponse({ status: 403, description: 'Not a coordinator of this club' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async stopQuiz(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.quizzesService.stopQuiz(id, req.user.id);
  }

  @Post(':id/reactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate a quiz - Sets the quiz as active again (Coordinator only)' })
  @ApiResponse({ status: 200, description: 'Quiz reactivated successfully' })
  @ApiResponse({ status: 403, description: 'Not a coordinator of this club' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async reactivateQuiz(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.quizzesService.reactivateQuiz(id, req.user.id);
  }

  @Delete(':id/attempts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all attempts for a quiz (Coordinator only)' })
  @ApiResponse({ status: 200, description: 'Quiz attempts cleared successfully' })
  @ApiResponse({ status: 403, description: 'Not a coordinator of this club' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async clearQuizAttempts(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.quizzesService.clearQuizAttempts(id, req.user.id);
  }
}


