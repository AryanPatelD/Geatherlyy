import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../cache/redis.service';
import { Quiz, QuizAttempt, Prisma, UserRole } from '@prisma/client';

import { ActivityService } from '../activity/activity.service';

@Injectable()
export class QuizzesService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private activityService: ActivityService,
  ) {}

  async create(data: any, userId: number): Promise<Quiz> {
    // Check for cooldown
    const cooldownKey = `quiz_creation_cooldown:${userId}`;
    const isInCooldown = await this.redis.get(cooldownKey);
    
    if (isInCooldown) {
      throw new ForbiddenException('Please wait 2 minutes before creating another quiz to prevent duplicates.');
    }

    // Extract questions from data and format them properly
    const { questions, ...quizData } = data;
    
    // Convert questions to match Prisma schema
    const formattedQuestions = questions?.map((q: any) => {
      const { image, imageUrl, ...rest } = q;
      return {
        ...rest,
        imageUrl: imageUrl || image || null, // Support both image and imageUrl field names
        type: q.type === 'single' ? 'MCQ' : q.type === 'multiple' ? 'MULTIPLE_ANSWER' : 'MCQ',
        // Convert correctAnswer from integer index to string array
        correctAnswer: typeof q.correctAnswer === 'number' 
          ? [q.correctAnswer.toString()] 
          : Array.isArray(q.correctAnswer) 
            ? q.correctAnswer.map(String) 
            : [String(q.correctAnswer)],
      };
    }) || [];
    
    const quiz = await this.prisma.quiz.create({
      data: {
        ...quizData,
        questions: {
          create: formattedQuestions,
        },
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        questions: true,
      },
    });

    // Set cooldown for 2 minutes (120 seconds)
    await this.redis.set(cooldownKey, 'true', 120);

    // Invalidate cache
    await this.redis.del(`club:${quiz.clubId}:quizzes`);
    // Attempt to invalidate filtered list if possible, otherwise rely on TTL
    const cacheKey = `quizzes:all:${JSON.stringify({ clubId: quiz.clubId })}`;
    await this.redis.del(cacheKey);

    return quiz;
  }

  async findAll(filters?: {
    clubId?: number;
    skip?: number;
    take?: number;
  }): Promise<Quiz[]> {
    const cacheKey = `quizzes:all:${JSON.stringify(filters || {})}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached as string);
      }
    } catch (error) {
      console.warn('Redis cache read failed for quizzes:', error);
    }

    const where: Prisma.QuizWhereInput = {};

    if (filters?.clubId) {
      where.clubId = filters.clubId;
    }

    const quizzes = await this.prisma.quiz.findMany({
      where,
      skip: filters?.skip,
      take: filters?.take || 20,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            category: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    try {
      await this.redis.set(cacheKey, JSON.stringify(quizzes), 60); // Cache for 1 minute
    } catch (error) {
      console.warn('Redis cache write failed for quizzes:', error);
    }

    return quizzes;
  }

  async findById(id: number, includeAnswers: boolean = false): Promise<Quiz> {
    const cacheKey = `quiz:${id}:${includeAnswers}`;
    const cached = await this.redis.getQuizData(cacheKey);

    if (cached) {
      return cached as any;
    }

    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        questions: {
          select: {
            id: true,
            text: true,
            options: true,
            correctAnswer: true, // Always include, filter on frontend if needed
            marks: true,
            order: true,
            imageUrl: true,
            type: true, // Include question type (MCQ or MULTIPLE_ANSWER)
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    // If correctAnswer should not be included, strip it from the response
    if (!includeAnswers) {
      const quizWithoutAnswers = {
        ...quiz,
        questions: quiz.questions.map((q: any) => {
          const { correctAnswer, ...rest } = q;
          return rest;
        }),
      };
      await this.redis.setQuizData(cacheKey, quizWithoutAnswers);
      return quizWithoutAnswers as any;
    }

    await this.redis.setQuizData(cacheKey, quiz);

    return quiz;
  }

  async update(id: number, data: Prisma.QuizUpdateInput, userId: number): Promise<Quiz> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        club: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    // Check permissions
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
        throw new ForbiddenException('User not found');
    }

    const isGlobalAdminOrFaculty = user.role === UserRole.ADMIN || user.role === UserRole.FACULTY;
    
    // Check if user is a coordinator of this specific club
    const isClubCoordinator = await this.prisma.clubCoordinator.findUnique({
        where: {
            clubId_userId: {
                clubId: quiz.clubId,
                userId: userId,
            }
        }
    });

    if (!isGlobalAdminOrFaculty && !isClubCoordinator) {
        throw new ForbiddenException('You do not have permission to update this quiz. You must be a coordinator of this club.');
    }

    const updatedQuiz = await this.prisma.quiz.update({
      where: { id },
      data,
      include: {
        club: true,
        questions: true,
      },
    });

    // Invalidate cache
    await this.redis.del(`quiz:${id}:true`);
    await this.redis.del(`quiz:${id}:false`);
    await this.redis.del(`quiz:${id}:stats`);
    await this.redis.del(`club:${quiz.clubId}:quizzes`);
    
    const cacheKey = `quizzes:all:${JSON.stringify({ clubId: quiz.clubId })}`;
    await this.redis.del(cacheKey);

    return updatedQuiz;
  }

  async delete(id: number, userId: number): Promise<void> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { club: true }
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    // Check permissions
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
        throw new ForbiddenException('User not found');
    }

    const isGlobalAdminOrFaculty = user.role === UserRole.ADMIN || user.role === UserRole.FACULTY;
    
    // Check if user is a coordinator of this specific club
    const isClubCoordinator = await this.prisma.clubCoordinator.findUnique({
        where: {
            clubId_userId: {
                clubId: quiz.clubId,
                userId: userId,
            }
        }
    });

    if (!isGlobalAdminOrFaculty && !isClubCoordinator) {
        throw new ForbiddenException('You do not have permission to delete this quiz. You must be a coordinator of this club.');
    }

    await this.prisma.quiz.delete({
      where: { id },
    });

    // Invalidate cache
    await this.redis.del(`quiz:${id}:true`);
    await this.redis.del(`quiz:${id}:false`);
    await this.redis.del(`quiz:${id}:stats`);
    await this.redis.del(`club:${quiz.clubId}:quizzes`);

    const cacheKey = `quizzes:all:${JSON.stringify({ clubId: quiz.clubId })}`;
    await this.redis.del(cacheKey);
  }

  async submitQuizAttempt(
    quizId: number,
    userId: number,
    answers: Record<number, number>, // questionId -> selectedOption
    violations: number = 0,
  ): Promise<any> { // Changing return type to any to support extra fields
    // Log violations if threshold exceeded
    if (violations > 3) {
      await this.activityService.logActivity(
        userId,
        'QUIZ_VIOLATION',
        `User exceeded violation limit (Count: ${violations}) for Quiz ID: ${quizId}`,
      );
    }

    const quiz = await this.findById(quizId, true);

    // Check if quiz has participant limit
    if ((quiz as any).maxParticipants && (quiz as any).maxParticipants > 0) {
      const participantCount = await this.prisma.quizAttempt.count({
        where: { quizId },
      });
      
      // Check if user already has an attempt (they don't count against the new limit)
      const userHasAttempt = await this.prisma.quizAttempt.findUnique({
        where: {
          quizId_userId: { quizId, userId },
        },
      });
      
      if (!userHasAttempt && participantCount >= (quiz as any).maxParticipants) {
        throw new ForbiddenException(`This quiz has reached its maximum number of participants (${(quiz as any).maxParticipants}).`);
      }
    }

    // Check if quiz has time limit and if user has ongoing attempt
    const existingAttempt = await this.prisma.quizAttempt.findFirst({
      where: {
        quizId,
        userId,
      },
      orderBy: {
        attemptedAt: 'desc',
      },
    });

    const startTime = existingAttempt?.attemptedAt || new Date();
    const timeTaken = Math.floor((Date.now() - startTime.getTime()) / 1000); // in seconds

    if (quiz.timeLimit) {
      const timeLimit = quiz.timeLimit * 60; // convert to seconds
      if (timeTaken > timeLimit) {
        throw new BadRequestException('Time limit exceeded');
      }
    }


    // Check attempt limits
    if (existingAttempt) {
      // Default maxAttempts to 1 if not set (though schema has default 1)
      const maxAttempts = quiz.maxAttempts || 1;
      const currentAttempts = existingAttempt.attemptCount || 1; // Handle legacy records with null/0

      if (currentAttempts >= maxAttempts) {
        throw new ForbiddenException(`You have reached the maximum number of attempts (${maxAttempts}) allowed for this quiz.`);
      }
    }

    // Calculate score
    let score = 0;
    let correctAnswersCount = 0;
    const results: any[] = [];

    for (const question of (quiz as any).questions) {
      const userAnswer = answers[question.id];
      let isCorrect = false;

      // Parse correct answers from DB (stored as string[])
      // We assume they are stored as stringified indices "0", "1", etc.
      const correctAnswers = question.correctAnswer || [];

      if (question.type === 'MULTIPLE_ANSWER') {
        // For multiple answer, user must select ALL correct options and NO incorrect ones
        // userAnswer should be an array of numbers (indices)
        if (Array.isArray(userAnswer)) {
          const userIndices = userAnswer.map(String); // Convert to strings to match DB
          
          // Check if sets are equal
          const isSetEqual = userIndices.length === correctAnswers.length && 
                             userIndices.every(val => correctAnswers.includes(val));
          
          isCorrect = isSetEqual;
        }
      } else {
        // Single choice / MCQ
        // userAnswer should be a number (index)
        if (userAnswer !== undefined) {
           isCorrect = correctAnswers.includes(String(userAnswer));
        }
      }

      if (isCorrect) {
        score += question.marks;
        correctAnswersCount++;
      }

      results.push({
        questionId: question.id,
        questionText: question.text,
        userAnswer,
        correctAnswer: correctAnswers, // Return correct answer for feedback
        explanation: 'Correct answer: ' + correctAnswers.map(i => question.options[parseInt(i)]).join(', '), // Helper text
        isCorrect,
        points: isCorrect ? question.marks : 0,
        maxPoints: question.marks
      });
    }

    const totalMarks = (quiz as any).totalMarks || 100;
    const percentage = totalMarks ? (score / totalMarks) * 100 : 0;
    const isPassed = score >= (quiz.passingMarks || 0);
    
    // Determine new attempt count
    // If existing, increment. If new, start at 1.
    const newAttemptCount = existingAttempt ? (existingAttempt.attemptCount || 1) + 1 : 1;

    // Create or update attempt
    const attempt = await this.prisma.quizAttempt.upsert({
      where: {
        quizId_userId: {
          quizId,
          userId,
        },
      },
      update: {
        score,
        totalMarks,
        percentage,
        timeTaken,
        answers: answers as any,
        isPassed,
        attemptCount: newAttemptCount,
        attemptedAt: new Date(),
      },
      create: {
        quizId,
        userId,
        score,
        totalMarks,
        percentage,
        timeTaken,
        answers: answers as any,
        isPassed,
        attemptCount: 1, // First attempt
        attemptedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
            clubId: true,
          },
        },
      },
    });

    // Invalidate leaderboard cache
    // OPTIMIZATION: Removed aggressive invalidation to prevent cache thrashing during mass submissions.
    // Leaderboards will update when their TTL expires (e.g. 5 minutes).
    // await this.redis.del('leaderboard:global');
    // await this.redis.del(`leaderboard:club:${quiz.clubId}`);

    // Return attempt with correctAnswers count
    return {
      ...attempt,
      correctAnswers: correctAnswersCount,
      totalQuestions: (quiz as any).questions.length,
      details: results, // Detailed question breakdown
    } as any;
  }

  async getUserAttempt(quizId: number, userId: number): Promise<QuizAttempt | null> {
    return this.prisma.quizAttempt.findUnique({
      where: {
        quizId_userId: {
          quizId,
          userId,
        },
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
            questions: {
              select: {
                id: true,
                text: true,
                options: true,
                correctAnswer: true,
                marks: true,
                order: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });
  }

  async getQuizLeaderboard(quizId: number, limit: number = 10): Promise<any[]> {
    const cacheKey = `quiz:${quizId}:leaderboard:${limit}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached as string);
    }

    // Ranking: Higher score first, then faster completion time
    // Note: We don't filter by attemptedAt since all attempts should have a timestamp
    const leaderboard = await this.prisma.quizAttempt.findMany({
      where: {
        quizId,
      },
      take: limit,
      orderBy: [
        { score: 'desc' },
        { timeTaken: 'asc' },
        { attemptedAt: 'asc' },
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
            totalMarks: true,
          },
        },
      },
    });

    const formattedLeaderboard = leaderboard.map((attempt, index) => ({
      rank: index + 1,
      userId: attempt.user.id,
      name: attempt.user.name,
      avatar: attempt.user.avatar,
      email: attempt.user.email,
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      percentage: attempt.percentage,
      timeTaken: attempt.timeTaken,
      attemptedAt: attempt.attemptedAt,
    }));

    await this.redis.set(cacheKey, JSON.stringify(formattedLeaderboard), 300); // 5 minutes

    return formattedLeaderboard;
  }

  async getQuizStats(quizId: number, userId: number): Promise<any> {
    // First verify permission - check if user can access stats for this quiz
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    // Check permissions
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const isGlobalAdminOrFaculty = user.role === UserRole.ADMIN || user.role === UserRole.FACULTY;
    
    // Check if user is a coordinator of this specific club
    const isClubCoordinator = await this.prisma.clubCoordinator.findUnique({
      where: {
        clubId_userId: {
          clubId: quiz.clubId,
          userId: userId,
        }
      }
    });

    if (!isGlobalAdminOrFaculty && !isClubCoordinator) {
      throw new ForbiddenException('You do not have permission to view this quiz stats. You must be a coordinator of this club.');
    }

    const cacheKey = `quiz:${quizId}:stats`;
    const cachedStats = await this.redis.get(cacheKey);

    if (cachedStats) {
      return JSON.parse(cachedStats as string);
    }

    const [totalAttempts, avgScore, maxScore] = await this.prisma.$transaction([
      this.prisma.quizAttempt.count({
        where: {
          quizId,
          attemptedAt: { not: null },
        },
      }),
      this.prisma.quizAttempt.aggregate({
        where: {
          quizId,
          attemptedAt: { not: null },
        },
        _avg: {
          score: true,
        },
      }),
      this.prisma.quizAttempt.aggregate({
        where: {
          quizId,
          attemptedAt: { not: null },
        },
        _max: {
          score: true,
        },
      }),
    ]);

    const stats = {
      totalAttempts,
      averageScore: avgScore._avg.score || 0,
      maxScore: maxScore._max.score || 0,
    };

    try {
      await this.redis.set(cacheKey, JSON.stringify(stats), 60);
    } catch (error) {
      console.warn('Redis cache write failed for quiz stats:', error);
    }

    return stats;
  }

  async canUserCreateQuiz(userId: number, clubId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    // Admin and Faculty can create quiz for any club
    if (([UserRole.ADMIN, UserRole.FACULTY] as UserRole[]).includes(user.role)) {
      return true;
    }

    // Check if user is a coordinator of the club
    const isCoordinator = await this.prisma.clubCoordinator.findFirst({
      where: { userId, clubId },
    });

    return !!isCoordinator;
  }

  /**
   * End a quiz - Sets the end date to now and optionally deactivates it
   * Only accessible to coordinators of the quiz's club
   */
  async endQuiz(quizId: number, userId: number): Promise<any> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { club: true },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    // Check permissions
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const isGlobalAdminOrFaculty = user.role === UserRole.ADMIN || user.role === UserRole.FACULTY;
    
    // Check if user is a coordinator of this specific club
    const isClubCoordinator = await this.prisma.clubCoordinator.findUnique({
      where: {
        clubId_userId: {
          clubId: quiz.clubId,
          userId: userId,
        },
      },
    });

    if (!isGlobalAdminOrFaculty && !isClubCoordinator) {
      throw new ForbiddenException('You must be a coordinator of this club to end this quiz');
    }

    const updatedQuiz = await this.prisma.quiz.update({
      where: { id: quizId },
      data: {
        endDate: new Date(),
        isActive: false,
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.redis.del(`quiz:${quizId}:true`);
    await this.redis.del(`quiz:${quizId}:false`);
    await this.redis.del(`club:${quiz.clubId}:quizzes`);

    return {
      message: `Quiz "${updatedQuiz.title}" has been ended`,
      quiz: updatedQuiz,
    };
  }

  /**
   * Stop a quiz - Immediately deactivates the quiz
   * Only accessible to coordinators of the quiz's club
   */
  async stopQuiz(quizId: number, userId: number): Promise<any> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { club: true },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    // Check permissions
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const isGlobalAdminOrFaculty = user.role === UserRole.ADMIN || user.role === UserRole.FACULTY;
    
    // Check if user is a coordinator of this specific club
    const isClubCoordinator = await this.prisma.clubCoordinator.findUnique({
      where: {
        clubId_userId: {
          clubId: quiz.clubId,
          userId: userId,
        },
      },
    });

    if (!isGlobalAdminOrFaculty && !isClubCoordinator) {
      throw new ForbiddenException('You must be a coordinator of this club to stop this quiz');
    }

    const updatedQuiz = await this.prisma.quiz.update({
      where: { id: quizId },
      data: {
        isActive: false,
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.redis.del(`quiz:${quizId}:true`);
    await this.redis.del(`quiz:${quizId}:false`);
    await this.redis.del(`club:${quiz.clubId}:quizzes`);

    return {
      message: `Quiz "${updatedQuiz.title}" has been stopped`,
      quiz: updatedQuiz,
    };
  }

  /**
   * Reactivate a quiz - Sets the quiz as active again
   * Only accessible to coordinators of the quiz's club
   */
  async reactivateQuiz(quizId: number, userId: number): Promise<any> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { club: true },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    // Check permissions
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const isGlobalAdminOrFaculty = user.role === UserRole.ADMIN || user.role === UserRole.FACULTY;
    
    // Check if user is a coordinator of this specific club
    const isClubCoordinator = await this.prisma.clubCoordinator.findUnique({
      where: {
        clubId_userId: {
          clubId: quiz.clubId,
          userId: userId,
        },
      },
    });

    if (!isGlobalAdminOrFaculty && !isClubCoordinator) {
      throw new ForbiddenException('You must be a coordinator of this club to reactivate this quiz');
    }

    const updatedQuiz = await this.prisma.quiz.update({
      where: { id: quizId },
      data: {
        isActive: true,
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.redis.del(`quiz:${quizId}:true`);
    await this.redis.del(`quiz:${quizId}:false`);
    await this.redis.del(`club:${quiz.clubId}:quizzes`);

    return {
      message: `Quiz "${updatedQuiz.title}" has been reactivated`,
      quiz: updatedQuiz,
    };
  }

  /**
   * Clear all attempts for a quiz
   * Only accessible to coordinators of the quiz's club
   */
  async clearQuizAttempts(quizId: number, userId: number): Promise<any> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { club: true },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    // Check permissions
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const isGlobalAdminOrFaculty = user.role === UserRole.ADMIN || user.role === UserRole.FACULTY;
    
    // Check if user is a coordinator of this specific club
    const isClubCoordinator = await this.prisma.clubCoordinator.findUnique({
      where: {
        clubId_userId: {
          clubId: quiz.clubId,
          userId: userId,
        },
      },
    });

    if (!isGlobalAdminOrFaculty && !isClubCoordinator) {
      throw new ForbiddenException('You must be a coordinator of this club to clear quiz attempts');
    }

    const deletedAttempts = await this.prisma.quizAttempt.deleteMany({
      where: { quizId },
    });

    // Invalidate cache
    await this.redis.del(`quiz:${quizId}:stats`);
    await this.redis.del(`quiz:${quizId}:leaderboard:10`);
    await this.redis.del(`leaderboard:club:${quiz.clubId}`);
    await this.redis.del('leaderboard:global');

    return {
      message: `Cleared ${deletedAttempts.count} attempts for quiz "${quiz.title}"`,
      deletedCount: deletedAttempts.count,
    };
  }
}
