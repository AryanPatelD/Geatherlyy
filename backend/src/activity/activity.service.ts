
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLog } from '@prisma/client';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async logActivity(userId: number, action: string, details?: string, ipAddress?: string): Promise<ActivityLog> {
    try {
      return await this.prisma.activityLog.create({
        data: {
          userId,
          action,
          details,
          ipAddress,
        },
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw error to prevent blocking main action
      return null as any;
    }
  }

  async getLogs(skip = 0, take = 50): Promise<{ logs: ActivityLog[]; total: number }> {
    const [logs, total] = await this.prisma.$transaction([
      this.prisma.activityLog.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.activityLog.count(),
    ]);

    return { logs, total };
  }
}
