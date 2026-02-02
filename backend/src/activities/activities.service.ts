import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Activity, Prisma, UserRole, ActivityType, ActivityStatus } from '@prisma/client';
import { NotificationService } from '../common/mailer/notification.service';

@Injectable()
export class ActivitiesService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async create(data: Prisma.ActivityCreateInput): Promise<Activity> {
    const activity = await this.prisma.activity.create({
      data,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    // Notify all club members about the new activity
    // Fire and forget - don't await to avoid blocking response
    this.notifyClubMembersAboutActivity(activity);

    return activity;
  }

  /**
   * Notify all club members about a new activity
   */
  private async notifyClubMembersAboutActivity(activity: any): Promise<void> {
    try {
      const clubMembers = await this.prisma.clubMember.findMany({
        where: { clubId: activity.clubId },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });

      for (const member of clubMembers) {
        this.notificationService.sendActivityNotification({
          userName: member.user.name,
          userEmail: member.user.email,
          clubName: activity.club?.name || 'Your Club',
          clubId: activity.clubId,
          activityTitle: activity.title,
          activityDate: activity.startDate,
          activityLocation: activity.location,
          activityType: activity.type,
          additionalMessage: activity.description,
        });
      }
    } catch (error) {
      // Log error but don't fail the activity creation
      console.error('Failed to send activity notifications:', error);
    }
  }

  async findAll(filters?: {
    clubId?: number;
    type?: ActivityType;
    status?: ActivityStatus;
    upcoming?: boolean;
    skip?: number;
    take?: number;
  }): Promise<Activity[]> {
    const where: Prisma.ActivityWhereInput = {};

    if (filters?.clubId) {
      where.clubId = filters.clubId;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.upcoming) {
      where.startDate = {
        gte: new Date(),
      };
    }

    return this.prisma.activity.findMany({
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
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  async findById(id: number): Promise<Activity> {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        club: {
          include: {
            coordinators: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    return activity;
  }

  async update(id: number, data: Prisma.ActivityUpdateInput): Promise<Activity> {
    return this.prisma.activity.update({
      where: { id },
      data,
      include: {
        club: true,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.activity.delete({
      where: { id },
    });
  }

  async getUpcomingActivities(limit: number = 10): Promise<Activity[]> {
    return this.prisma.activity.findMany({
      where: {
        startDate: {
          gte: new Date(),
        },
        status: ActivityStatus.UPCOMING,
      },
      take: limit,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            category: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }

  async getActivityStats(): Promise<any> {
    const [total, upcoming, completed, cancelled] = await this.prisma.$transaction([
      this.prisma.activity.count(),
      this.prisma.activity.count({
        where: {
          startDate: { gte: new Date() },
          status: ActivityStatus.UPCOMING,
        },
      }),
      this.prisma.activity.count({
        where: { status: ActivityStatus.COMPLETED },
      }),
      this.prisma.activity.count({
        where: { status: ActivityStatus.CANCELLED },
      }),
    ]);

    return {
      total,
      upcoming,
      completed,
      cancelled,
    };
  }

  async canUserModifyActivity(activityId: number, userId: number): Promise<boolean> {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        club: {
          include: {
            coordinators: true,
          },
        },
      },
    });

    if (!activity) {
      return false;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    // Admin and Faculty can modify any activity
    if (([UserRole.ADMIN, UserRole.FACULTY] as UserRole[]).includes(user.role)) {
      return true;
    }

    // Coordinator can modify their club's activities
    if (user.role === UserRole.COORDINATOR) {
      const isCoordinator = activity.club.coordinators.some(
        (coord) => coord.userId === userId,
      );
      return isCoordinator;
    }

    return false;
  }

  async canUserCreateActivity(userId: number, clubId: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    // Admin and Faculty can create activity for any club
    if (([UserRole.ADMIN, UserRole.FACULTY] as UserRole[]).includes(user.role)) {
      return true;
    }

    // Check if user is a member or coordinator of the club
    const [isMember, isCoordinator] = await Promise.all([
      this.prisma.clubMember.findFirst({
        where: { userId, clubId },
      }),
      this.prisma.clubCoordinator.findFirst({
        where: { userId, clubId },
      }),
    ]);

    return !!(isMember || isCoordinator);
  }
}




