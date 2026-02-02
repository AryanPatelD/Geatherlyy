import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { NotificationService } from '../common/notifications/notification.service';
import { ApprovalRequest, Prisma, ApprovalStatus, UserRole } from '@prisma/client';

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private notificationService: NotificationService,
  ) { }

  async create(data: Prisma.ApprovalRequestCreateInput): Promise<ApprovalRequest> {
    return this.prisma.approvalRequest.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(filters?: {
    status?: ApprovalStatus;
    requestedRole?: UserRole;
    skip?: number;
    take?: number;
  }): Promise<ApprovalRequest[]> {
    const where: Prisma.ApprovalRequestWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.requestedRole) {
      where.requestedRole = filters.requestedRole;
    }

    return this.prisma.approvalRequest.findMany({
      where,
      skip: filters?.skip,
      take: filters?.take || 20,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: number): Promise<ApprovalRequest> {
    const request = await this.prisma.approvalRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`Approval request with ID ${id} not found`);
    }

    return request;
  }

  async requestRoleChange(userId: number, requestedRole: UserRole, reason: string): Promise<ApprovalRequest> {
    // Check if user already has a pending request
    const existingRequest = await this.prisma.approvalRequest.findFirst({
      where: {
        userId,
        status: ApprovalStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException('You already have a pending role change request');
    }

    // Cannot request to be ADMIN
    if (requestedRole === UserRole.ADMIN) {
      throw new BadRequestException('Cannot request admin role');
    }

    return this.create({
      user: {
        connect: { id: userId },
      },
      requestedRole,
      reason,
    });
  }

  async requestCoordinatorRole(userId: number, clubId: number, reason: string): Promise<ApprovalRequest> {
    // Check if user already has a pending coordinator request for this club
    const existingRequest = await this.prisma.approvalRequest.findFirst({
      where: {
        userId,
        clubId,
        requestedRole: UserRole.COORDINATOR,
        status: ApprovalStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException('You already have a pending coordinator request for this club');
    }

    // Check if user is already a coordinator for this club
    const existingCoordinator = await this.prisma.clubCoordinator.findFirst({
      where: {
        userId,
        clubId,
      },
    });

    if (existingCoordinator) {
      throw new BadRequestException('You are already a coordinator for this club');
    }

    return this.create({
      user: {
        connect: { id: userId },
      },
      club: {
        connect: { id: clubId },
      },
      requestedRole: UserRole.COORDINATOR,
      reason,
      requestedFor: 'CLUB_COORDINATOR',
    });
  }


  async reviewRequest(
    requestId: number,
    reviewerId: number,
    status: ApprovalStatus,
  ): Promise<ApprovalRequest> {
    const request = await this.findById(requestId);

    if (request.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('This request has already been reviewed');
    }

    // Update request
    const updatedRequest = await this.prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
      include: {
        user: true,
        reviewer: true,
        club: true,
      },
    });

    // If approved, handle role assignment
    if (status === ApprovalStatus.APPROVED) {
      // If this is a coordinator request, add to ClubCoordinator table
      if (request.requestedRole === 'COORDINATOR' && request.clubId) {
        await this.prisma.clubCoordinator.create({
          data: {
            clubId: request.clubId,
            userId: request.userId,
          },
        });
      } else {
        // Otherwise update user role
        await this.usersService.updateRole(request.userId, request.requestedRole);
      }
    }

    // Send notification to the user about the approval/rejection
    this.sendApprovalNotification(updatedRequest, status);

    return updatedRequest;
  }

  /**
   * Send notification about approval/rejection to the user
   */
  private async sendApprovalNotification(request: any, status: ApprovalStatus): Promise<void> {
    try {
      const notificationStatus = status === ApprovalStatus.APPROVED ? 'APPROVED' : 'REJECTED';
      
      if (request.requestedRole === 'COORDINATOR' && request.club) {
        // Coordinator application notification
        this.notificationService.sendCoordinatorApplicationNotification({
          userName: request.user.name,
          userEmail: request.user.email,
          clubName: request.club.name,
          clubId: request.club.id,
          status: notificationStatus,
          reviewerName: request.reviewer?.name,
        });
      } else {
        // General approval notification
        this.notificationService.sendApprovalNotification({
          userName: request.user.name,
          userEmail: request.user.email,
          requestType: `${request.requestedRole} Role Request`,
          status: notificationStatus,
          clubName: request.club?.name,
          clubId: request.club?.id,
          reviewerName: request.reviewer?.name,
        });
      }
    } catch (error) {
      console.error('Failed to send approval notification:', error);
    }
  }

  async getPendingRequests(): Promise<ApprovalRequest[]> {
    return this.findAll({
      status: ApprovalStatus.PENDING,
    });
  }

  async getUserRequests(userId: number): Promise<ApprovalRequest[]> {
    return this.prisma.approvalRequest.findMany({
      where: { userId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getApprovalStats(): Promise<any> {
    const [pending, approved, rejected] = await this.prisma.$transaction([
      this.prisma.approvalRequest.count({
        where: { status: ApprovalStatus.PENDING },
      }),
      this.prisma.approvalRequest.count({
        where: { status: ApprovalStatus.APPROVED },
      }),
      this.prisma.approvalRequest.count({
        where: { status: ApprovalStatus.REJECTED },
      }),
    ]);

    return {
      pending,
      approved,
      rejected,
      total: pending + approved + rejected,
    };
  }
}





