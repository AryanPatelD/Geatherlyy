import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../cache/redis.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class DataManagementService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Verify if user is a coordinator of the specified club
   */
  async verifyClubCoordinator(userId: number, clubId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Admin and Faculty have full access
    if (user.role === UserRole.ADMIN || user.role === UserRole.FACULTY) {
      return true;
    }

    // Check if user is a coordinator of this specific club
    const isCoordinator = await this.prisma.clubCoordinator.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    return !!isCoordinator;
  }

  /**
   * Truncate all tables for a specific club except users table
   * Only accessible to coordinators of that club
   */
  async truncateClubData(clubId: number, userId: number): Promise<{ message: string; deletedCounts: Record<string, number> }> {
    // Verify the user is a coordinator of this club
    const hasPermission = await this.verifyClubCoordinator(userId, clubId);
    
    if (!hasPermission) {
      throw new ForbiddenException('You must be a coordinator of this club to perform this action');
    }

    // Verify club exists
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) {
      throw new NotFoundException(`Club with ID ${clubId} not found`);
    }

    const deletedCounts: Record<string, number> = {};

    // Use transaction to ensure all deletions are atomic
    await this.prisma.$transaction(async (tx) => {
      // Delete quiz attempts for quizzes in this club
      const quizzes = await tx.quiz.findMany({
        where: { clubId },
        select: { id: true },
      });
      const quizIds = quizzes.map(q => q.id);
      
      if (quizIds.length > 0) {
        const deletedAttempts = await tx.quizAttempt.deleteMany({
          where: { quizId: { in: quizIds } },
        });
        deletedCounts['quizAttempts'] = deletedAttempts.count;

        // Delete questions for these quizzes
        const deletedQuestions = await tx.question.deleteMany({
          where: { quizId: { in: quizIds } },
        });
        deletedCounts['questions'] = deletedQuestions.count;
      }

      // Delete quizzes for this club
      const deletedQuizzes = await tx.quiz.deleteMany({
        where: { clubId },
      });
      deletedCounts['quizzes'] = deletedQuizzes.count;

      // Delete activities for this club
      const deletedActivities = await tx.activity.deleteMany({
        where: { clubId },
      });
      deletedCounts['activities'] = deletedActivities.count;

      // Delete resources for this club
      const deletedResources = await tx.resource.deleteMany({
        where: { clubId },
      });
      deletedCounts['resources'] = deletedResources.count;

      // Delete comments for this club
      const deletedComments = await tx.comment.deleteMany({
        where: { clubId },
      });
      deletedCounts['comments'] = deletedComments.count;

      // Delete removal requests for this club
      const deletedRemovalRequests = await tx.clubMemberRemovalRequest.deleteMany({
        where: { clubId },
      });
      deletedCounts['removalRequests'] = deletedRemovalRequests.count;

      // Delete approval requests for this club
      const deletedApprovalRequests = await tx.approvalRequest.deleteMany({
        where: { clubId },
      });
      deletedCounts['approvalRequests'] = deletedApprovalRequests.count;

      // Note: We keep club members and coordinators as they are user relationships
      // and the user asked to keep user data intact
    });

    // Clear related caches
    await this.redis.del(`club:${clubId}:quizzes`);
    await this.redis.del(`leaderboard:club:${clubId}`);
    
    // Clear all quiz-related caches
    const quizzes = await this.prisma.quiz.findMany({
      where: { clubId },
      select: { id: true },
    });
    for (const quiz of quizzes) {
      await this.redis.del(`quiz:${quiz.id}:true`);
      await this.redis.del(`quiz:${quiz.id}:false`);
      await this.redis.del(`quiz:${quiz.id}:stats`);
      await this.redis.del(`quiz:${quiz.id}:leaderboard:10`);
    }

    return {
      message: `Successfully truncated data for club ${club.name}`,
      deletedCounts,
    };
  }

  /**
   * Get a summary of data that would be deleted for a club
   */
  async getClubDataSummary(clubId: number, userId: number): Promise<Record<string, number>> {
    // Verify the user is a coordinator of this club
    const hasPermission = await this.verifyClubCoordinator(userId, clubId);
    
    if (!hasPermission) {
      throw new ForbiddenException('You must be a coordinator of this club to view this data');
    }

    // Verify club exists
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) {
      throw new NotFoundException(`Club with ID ${clubId} not found`);
    }

    const quizzes = await this.prisma.quiz.findMany({
      where: { clubId },
      select: { id: true },
    });
    const quizIds = quizzes.map(q => q.id);

    const [
      quizCount,
      attemptCount,
      questionCount,
      activityCount,
      resourceCount,
      commentCount,
      removalRequestCount,
      approvalRequestCount,
    ] = await Promise.all([
      this.prisma.quiz.count({ where: { clubId } }),
      quizIds.length > 0 ? this.prisma.quizAttempt.count({ where: { quizId: { in: quizIds } } }) : 0,
      quizIds.length > 0 ? this.prisma.question.count({ where: { quizId: { in: quizIds } } }) : 0,
      this.prisma.activity.count({ where: { clubId } }),
      this.prisma.resource.count({ where: { clubId } }),
      this.prisma.comment.count({ where: { clubId } }),
      this.prisma.clubMemberRemovalRequest.count({ where: { clubId } }),
      this.prisma.approvalRequest.count({ where: { clubId } }),
    ]);

    return {
      quizzes: quizCount,
      quizAttempts: attemptCount,
      questions: questionCount,
      activities: activityCount,
      resources: resourceCount,
      comments: commentCount,
      removalRequests: removalRequestCount,
      approvalRequests: approvalRequestCount,
    };
  }
}
