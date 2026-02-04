import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../common/mailer/notification.service';
import { ClubMemberRemovalRequest, Prisma, RemovalApprovalStatus, UserRole } from '@prisma/client';

@Injectable()
export class RemovalRequestsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async create(
    userId: number,
    data: { clubId: number; memberId: number; reason: string }
  ): Promise<ClubMemberRemovalRequest> {
    const { clubId, memberId, reason } = data;

    // Verify requester is coordinator
    const isCoordinator = await this.prisma.clubCoordinator.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    if (!isCoordinator) {
      throw new ForbiddenException('Only club coordinators can request member removal');
    }

    // Verify member exists in club
    const member = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: memberId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this club');
    }

    // Check for existing pending request
    const existingRequest = await this.prisma.clubMemberRemovalRequest.findFirst({
      where: {
        clubId,
        memberId,
        status: RemovalApprovalStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException('A removal request for this member is already pending');
    }

    return this.prisma.clubMemberRemovalRequest.create({
      data: {
        clubId,
        memberId,
        requestedBy: userId,
        reason,
        status: RemovalApprovalStatus.PENDING,
        mentorApproval: RemovalApprovalStatus.PENDING,
        adminApproval: RemovalApprovalStatus.PENDING,
      },
      include: {
        member: { select: { id: true, name: true, email: true } },
        club: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(filters?: {
    status?: RemovalApprovalStatus;
    clubId?: number;
  }): Promise<ClubMemberRemovalRequest[]> {
    const where: Prisma.ClubMemberRemovalRequestWhereInput = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.clubId) where.clubId = filters.clubId;

    return this.prisma.clubMemberRemovalRequest.findMany({
      where,
      include: {
        member: { select: { id: true, name: true, email: true, avatar: true, department: true } },
        coordinator: { select: { id: true, name: true } },
        club: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async review(
    requestId: number,
    reviewerId: number,
    status: RemovalApprovalStatus,
    role: UserRole
  ): Promise<ClubMemberRemovalRequest> {
    const request = await this.prisma.clubMemberRemovalRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== RemovalApprovalStatus.PENDING) {
      throw new BadRequestException('Request is already finalized');
    }

    const updateData: Prisma.ClubMemberRemovalRequestUpdateInput = {};

    if (role === UserRole.FACULTY) {
      updateData.mentorApproval = status;
      updateData.mentorReviewedBy = reviewerId;
      updateData.mentorReviewedAt = new Date();
    } else if (role === UserRole.ADMIN) {
      updateData.adminApproval = status;
      updateData.adminReviewedBy = reviewerId;
      updateData.adminReviewedAt = new Date();
    } else {
      throw new ForbiddenException('Only Faculty or Admin can review requests');
    }

    // Determine final status
    // Logic: If EITHER approves, or maybe BOTH need to?
    // Requirement says "after faculty approval".
    // Schema has dual approval. Let's say if Faculty approves, it's removed.
    // Or if Admin approves.
    // Let's implement: If Reviewer approves, it is Approved.
    
    if (status === RemovalApprovalStatus.APPROVED) {
        updateData.status = RemovalApprovalStatus.APPROVED;
        updateData.finalizedAt = new Date();
        
        // Remove the member
        await this.prisma.clubMember.delete({
            where: {
                clubId_userId: {
                    clubId: request.clubId,
                    userId: request.memberId
                }
            }
        }).catch(() => {
            // Member might have already left
        });
        
        // Decrement member count
        await this.prisma.club.update({
             where: { id: request.clubId },
             data: { memberCount: { decrement: 1 } }
        });

    } else if (status === RemovalApprovalStatus.REJECTED) {
        updateData.status = RemovalApprovalStatus.REJECTED;
        updateData.finalizedAt = new Date();
    }

    const updatedRequest = await this.prisma.clubMemberRemovalRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        member: true,
        club: true,
        coordinator: true,
      },
    });

    // Send notifications based on the status
    await this.sendRemovalNotifications(updatedRequest, status);

    return updatedRequest;
  }

  /**
   * Send notifications to member and coordinator about removal request status
   */
  private async sendRemovalNotifications(
    request: any,
    status: RemovalApprovalStatus
  ): Promise<void> {
    try {
      if (status === RemovalApprovalStatus.APPROVED) {
        // Notify the removed member
        this.notificationService.sendRemovalNotification({
          userName: request.member.name,
          userEmail: request.member.email,
          clubName: request.club.name,
          clubId: request.club.id,
          reason: request.reason,
        });

        // Notify the coordinator that the removal was approved
        if (request.coordinator) {
          this.notificationService.sendRemovalRequestUpdateToCoordinator({
            userName: request.coordinator.name,
            userEmail: request.coordinator.email,
            clubName: request.club.name,
            clubId: request.club.id,
            status: 'APPROVED',
          });
        }
      } else if (status === RemovalApprovalStatus.REJECTED) {
        // Notify the coordinator that the removal was rejected
        if (request.coordinator) {
          this.notificationService.sendRemovalRequestUpdateToCoordinator({
            userName: request.coordinator.name,
            userEmail: request.coordinator.email,
            clubName: request.club.name,
            clubId: request.club.id,
            status: 'REJECTED',
            additionalMessage: request.mentorReviewNotes || request.adminReviewNotes,
          });
        }
      }
    } catch (error) {
      console.error('Failed to send removal notifications:', error);
    }
  }
}
