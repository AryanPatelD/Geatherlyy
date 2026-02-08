import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getPlatformAnalytics(userId: number, role: string) {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (role === 'FACULTY') {
      // Faculty Specific Analytics
      const myClubs = await this.prisma.club.findMany({
        where: {
          OR: [
            { convenorId: userId },
            { mentors: { some: { id: userId } } }
          ],
          approvalStatus: 'APPROVED'
        },
        include: {
          _count: {
            select: { 
              members: true,
              activities: true,
              resources: true
            }
          }
        }
      });

      const myClubIds = myClubs.map(c => c.id);
      
      const totalMembers = myClubs.reduce((acc, club) => acc + club._count.members, 0);
      const totalActivities = myClubs.reduce((acc, club) => acc + club._count.activities, 0);
      const totalResources = myClubs.reduce((acc, club) => acc + club._count.resources, 0);

      // Get upcoming activities for my clubs
      const upcomingActivities = await this.prisma.activity.count({
        where: {
          clubId: { in: myClubIds },
          startDate: { gte: now },
          status: 'UPCOMING'
        }
      });

      // Get pending approval requests for my clubs (e.g. member joins if applicable, or role requests)
      // Assuming ApprovalRequest is linked to clubId
      const pendingRequests = await this.prisma.approvalRequest.count({
        where: {
          clubId: { in: myClubIds },
          status: 'PENDING'
        }
      });

      return {
        role: 'FACULTY',
        totalClubs: myClubs.length,
        totalMembers,
        totalActivities,
        totalResources,
        upcomingActivities,
        pendingRequests,
        myClubs: myClubs.map(club => ({
          id: club.id,
          name: club.name,
          members: club._count.members,
          activities: club._count.activities
        })).sort((a, b) => b.members - a.members)
      };
    }

    // Admin / Global Analytics
    const [
      totalUsers,
      newUsers,
      activeClubs,
      newClubs,
      totalActivities,
      pendingApprovals,
      quizAttempts,
      pendingClubs,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: lastMonth } } }),
      this.prisma.club.count({ where: { approvalStatus: 'APPROVED' } }),
      this.prisma.club.count({ where: { approvalStatus: 'APPROVED', createdAt: { gte: lastMonth } } }),
      this.prisma.activity.count(),
      this.prisma.approvalRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.quizAttempt.count(),
      this.prisma.club.count({ where: { approvalStatus: 'PENDING' } }),
    ]);

    // Calculate user growth percentage
    const previousUsers = totalUsers - newUsers;
    const userGrowth = previousUsers > 0 ? Math.round((newUsers / previousUsers) * 100) : 0;

    // Engagement Rate
    const activeUserCount = await this.prisma.quizAttempt.groupBy({
      by: ['userId'],
      where: { attemptedAt: { gte: lastWeek } },
    });
    const activeUsers = activeUserCount.length;
    const engagementRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    // Get top clubs by member count
    const topClubs = await this.prisma.club.findMany({
      where: { approvalStatus: 'APPROVED' },
      include: {
        _count: {
          select: { members: true },
        },
      },
      orderBy: {
        members: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    return {
      role: 'ADMIN',
      totalUsers,
      activeClubs,
      totalActivities,
      pendingApprovals,
      newClubs,
      pendingClubs,
      userGrowth: `↑ ${userGrowth}%`,
      avgAttendance: 0, 
      engagementRate,
      engagementChange: '↑ 0%', 
      topClubs: topClubs.map((club) => ({
        id: club.id,
        name: club.name,
        members: club._count.members,
      })),
    };
  }
}
