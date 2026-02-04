import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getPlatformAnalytics() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

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

    // Engagement Rate (Active users in last week / Total users)
    // Note: Assuming 'updatedAt' on user or login logs tracks activity. 
    // For now, using quiz attempts + activity participants as a proxy or just simplistic logic.
    // Let's use a simple heuristic: Users who created an attempt or joined a club recently.
    // Since we don't have a dedicated 'lastLogin' field readily visible, we'll placeholder this or use a simple count if possible.
    // Better approach: Count unique users who attempted a quiz in last week.
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
