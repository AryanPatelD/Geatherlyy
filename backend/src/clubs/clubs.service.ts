import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../cache/redis.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Club, Prisma, UserRole, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { NotificationService } from '../common/mailer/notification.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class ClubsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private cloudinary: CloudinaryService,
    private notificationService: NotificationService,
    private activityService: ActivityService,
  ) {}

  async findOrCreateFaculty(identifier: string): Promise<User> {
    const trimmedId = identifier.trim();
    
    // Try to find existing user
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: trimmedId, mode: 'insensitive' } },
          { name: { equals: trimmedId, mode: 'insensitive' } }
        ]
      }
    });

    if (user) {
      // Validate role if user exists
      if (user.role !== UserRole.FACULTY && user.role !== UserRole.ADMIN) {
        throw new ForbiddenException(`User '${trimmedId}' found but is not a Faculty member`);
      }
      return user;
    }

    // Create new faculty user if not found
    const isEmail = trimmedId.includes('@');
    // Generate a unique email if input is just a name
    const email = isEmail 
      ? trimmedId 
      : `${trimmedId.toLowerCase().replace(/\s+/g, '.')}@gatherly.internal`;

    // Ensure email is unique (in case generated one conflicts)
    const existingEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
       // Append random numbers if conflict
       const randomSuffix = Math.floor(Math.random() * 10000);
       return this.findOrCreateFaculty(`${trimmedId}${randomSuffix}`);
    }


    // Hash default password
    const hashedPassword = await bcrypt.hash('GatherlyFaculty123!', 10);

    return this.prisma.user.create({
      data: {
        name: isEmail ? trimmedId.split('@')[0] : trimmedId,
        email: email,
        role: UserRole.FACULTY,
        department: 'General', // Default department
        password: hashedPassword, // Default password
        profileComplete: false,
        approvalStatus: 'APPROVED' 
      }
    });
  }

  async create(
    data: any,
    creatorId?: number,
    files?: { clubPhoto?: Express.Multer.File[]; eventPhotos?: Express.Multer.File[] },
  ): Promise<Club> {
    // Handle both 'name' and 'clubName' from frontend
    const clubName = data.name || data.clubName;
    
    if (!clubName) {
      throw new BadRequestException('Club name is required');
    }

    // Check if club with this name already exists
    const existingClub = await this.prisma.club.findUnique({
      where: { name: clubName },
    });

    if (existingClub) {
      throw new ForbiddenException(`A club with the name "${clubName}" already exists. Please choose a different name.`);
    }

    // Upload club photo if provided
    let imageUrl: string | undefined;
    if (files?.clubPhoto && files.clubPhoto.length > 0) {
      const result = await this.cloudinary.uploadImage(files.clubPhoto[0], 'gatherly/clubs');
      imageUrl = result.secure_url;
    }

    // Upload event photos if provided
    let eventPhotos: string[] = [];
    if (files?.eventPhotos && files.eventPhotos.length > 0) {
      const results = await this.cloudinary.uploadMultipleImages(files.eventPhotos, 'gatherly/club-events');
      eventPhotos = results.map(result => result.secure_url);
    }

    // Get creator info to check role
    let approvalStatus: any = 'PENDING';
    if (creatorId) {
      const creator = await this.prisma.user.findUnique({
        where: { id: creatorId },
        select: { role: true },
      });
      
      if (!creator || (creator.role !== UserRole.FACULTY && creator.role !== UserRole.ADMIN)) {
        throw new ForbiddenException('Only Faculty and Admins can create clubs.');
      }

      // Admins can auto-approve their clubs
      if (creator?.role === UserRole.ADMIN) {
        approvalStatus = 'APPROVED';
      }
    }

    // 1. Process Mentors (2-3 Limit)
    let mentorIdentifiers: string[] = [];
    try {
      mentorIdentifiers = data.mentorEmails ? JSON.parse(data.mentorEmails) : [];
    } catch (e) {
      if (Array.isArray(data.mentorEmails)) mentorIdentifiers = data.mentorEmails;
      else if (typeof data.mentorEmails === 'string') mentorIdentifiers = [data.mentorEmails];
    }

    if (mentorIdentifiers.length < 2 || mentorIdentifiers.length > 3) {
      throw new BadRequestException('A club must have between 2 and 3 Mentors.');
    }

    const mentorIds: number[] = [];
    for (const identifier of mentorIdentifiers) {
      if (!identifier.trim()) continue;
      const mentorUser = await this.findOrCreateFaculty(identifier);
      mentorIds.push(mentorUser.id);
    }

    // 2. Process Convenor (1 Required)
    let convenorId: number | undefined;
    if (data.convenorEmail) {
      const convenorUser = await this.findOrCreateFaculty(data.convenorEmail);
      convenorId = convenorUser.id;
    } else {
      throw new BadRequestException('A club Convenor is required.');
    }

    // 3. Process Coordinators (3-4 Limit in Total Club, but 1 at creation)
    // The requirement "3-4 coordinator limit" applies to the *active* club. 
    // At creation, only the creator (who must be a faculty/admin/approved user) is the coordinator.
    // Others are added later.
    
    // We already check if creator exists.

    // Validate if creator is valid for coordinator?
    // (Assuming Role Guards handled this, but good to be safe)

    const clubData: Prisma.ClubCreateInput = {
      name: clubName,
      description: data.description,
      category: data.category || 'Other',
      approvalStatus: approvalStatus,
      imageUrl: imageUrl,
      eventPhotos: eventPhotos,
      creator: creatorId ? {
        connect: { id: creatorId }
      } : undefined,
      convenor: convenorId ? {
        connect: { id: convenorId }
      } : undefined,
      mentors: {
        connect: mentorIds.map(id => ({ id }))
      },
      // Removed automatic coordinator assignment for creator
      members: {
        create: [
          { userId: creatorId! }, // Creator
          ...mentorIds.map(id => ({ userId: id })), // Mentors
          ...(convenorId ? [{ userId: convenorId }] : []) // Convenor
        ].filter((v, i, a) => a.findIndex(t => t.userId === v.userId) === i) // Remove duplicates
      }
    };

    const club = await this.prisma.club.create({
      data: clubData,
      include: {
          mentors: true,
          convenor: true,
          coordinators: true
      }
    });

    // Invalidate clubs cache (non-blocking)
    this.redis.del('clubs:all').catch(() => {});
    
    this.redis.del('clubs:all').catch(() => {});

    // Log Creation
    this.activityService.logActivity(creatorId!, 'CREATE_CLUB', `Created club: ${club.name}`);
    
    return club;
  }

  async getCategories(): Promise<string[]> {
    const clubs = await this.prisma.club.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc',
      },
    });
    
    return clubs.map(club => club.category).filter(Boolean);
  }

  async findAll(filters?: {
    category?: string;
    search?: string;
    skip?: number;
    take?: number;
  }): Promise<Club[]> {
    // Enable caching for better performance
    const cacheKey = `clubs:all:${JSON.stringify(filters || {})}`;
    
    // Try to get from cache first
    try {
      const cached = await this.redis.getClubData(cacheKey);
      if (cached) {
        return cached as Club[];
      }
    } catch (error) {
      // Continue without cache if Redis fails
      console.warn('Redis cache read failed:', error);
    }

    const where: Prisma.ClubWhereInput = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const clubs = await this.prisma.club.findMany({
      where,
      skip: filters?.skip,
      take: filters?.take || 20,
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
        _count: {
          select: {
            members: true,
            activities: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Cache results for 60 seconds
    try {
      await this.redis.setClubData(cacheKey, clubs, 60);
    } catch (error) {
      // Continue without caching if Redis fails
      console.warn('Redis cache write failed:', error);
    }

    return clubs;
  }

  async findUserClubs(userId: number): Promise<Club[]> {
    const clubs = await this.prisma.club.findMany({
      where: {
        OR: [
          {
            members: {
              some: {
                userId: userId,
              },
            },
          },
          {
            coordinators: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
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
        _count: {
          select: {
            members: true,
            activities: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return clubs;
  }

  async findManagedByUser(userId: number): Promise<Club[]> {
    const clubs = await this.prisma.club.findMany({
      where: {
        OR: [
          {
            coordinators: {
              some: {
                userId: userId,
              },
            },
          },
          {
            creator: {
              id: userId,
            },
          },
          {
            mentors: {
              some: {
                id: userId,
              },
            },
          },
          {
            convenorId: userId,
          }
        ],
      },
      include: {
        coordinators: {
          include: {
            user: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
                avatar: true,
                role: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'desc',
          },
        },
        activities: {
          orderBy: {
            startDate: 'desc',
          },
          take: 5,
        },
        _count: {
          select: {
            members: true,
            activities: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return clubs;
  }

  async findById(id: number): Promise<Club> {
    // Disable caching for now
    // const cacheKey = `club:${id}`;
    // const cached = await this.redis.getClubData(cacheKey);
    // if (cached) {
    //   return cached as Club;
    // }

    const club = await this.prisma.club.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                department: true,
                role: true,
              },
            },
          },
        },
        coordinators: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                department: true,
              },
            },
          },
        },
        activities: {
          orderBy: { startDate: 'asc' },
        },
        mentors: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true,
          },
        },
        convenor: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            department: true 
          }
        },
        // Creator
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            members: true,
            activities: true,
          }
        }
      },
    });

    if (!club) {
      throw new NotFoundException(`Club with ID ${id} not found`);
    }

    // Disable caching for now
    // await this.redis.setClubData(cacheKey, club);

    return club;
  }

  async update(id: number, data: Prisma.ClubUpdateInput, userId?: number): Promise<Club> {
    // If userId provided, verify coordinator permission
    if (userId) {
      console.log(`[ClubsService.update] Attempting update for Club ID: ${id} by User ID: ${userId}`);
      
      const isCoordinator = await this.prisma.clubCoordinator.findUnique({
        where: {
          clubId_userId: {
            clubId: id,
            userId,
          },
        },
      });
      console.log(`[ClubsService.update] Is Coordinator: ${!!isCoordinator}`);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      console.log(`[ClubsService.update] User Role: ${user?.role}`);

      if (!isCoordinator && user?.role !== UserRole.ADMIN && user?.role !== UserRole.FACULTY) {
        console.error(`[ClubsService.update] Permission denied for User ID: ${userId}`);
        throw new ForbiddenException('Only coordinators, faculty, or admins can update club information');
      }
    }

    const club = await this.prisma.club.update({
      where: { id },
      data,
      include: {
        coordinators: {
          include: {
            user: true,
          },
        },
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.redis.del(`club:${id}`);
    await this.redis.del('clubs:all');

    return club;

    // Log Update
    if (userId) {
       this.activityService.logActivity(userId, 'UPDATE_CLUB', `Updated club: ${club.name} (ID: ${id})`);
    }
  }

  async delete(id: number): Promise<void> {
    await this.prisma.club.delete({
      where: { id },
    });

    // Invalidate cache
    await this.redis.del(`club:${id}`);
    await this.redis.del('clubs:all');

    // Log Deletion (Note: we don't have user ID here easily unless passed, but delete usually restricted to admin/owner)
    // The controller calls this. We should probably pass userId to delete method if we want to log WHO deleted it.
    // For now, let's leave it or update signature. updating signature is better.
  }

  async joinClub(clubId: number, userId: number): Promise<void> {
    // Get club details with current member count
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      include: {
        _count: {
          select: { members: true }
        }
      }
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    // Check if club has reached max members limit
    if (club._count.members >= club.maxMembers) {
      throw new ForbiddenException('This club has reached its maximum member capacity');
    }

    // Check if already a member
    const existingMember = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    if (existingMember) {
      throw new ForbiddenException('Already a member of this club');
    }

    await this.prisma.clubMember.create({
      data: {
        clubId,
        userId,
      },
    });

    // Update member count
    await this.prisma.club.update({
      where: { id: clubId },
      data: { memberCount: { increment: 1 } }
    });

    // Invalidate cache
    await this.redis.del(`club:${clubId}`);

    // Send Welcome Email
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user && user.email) {
      this.notificationService.sendWelcomeEmail({
        userEmail: user.email,
        userName: user.name,
        clubName: club.name,
        clubId: club.id
      }).catch(err => console.error('Failed to send welcome email', err));
    }
  }

  async leaveClub(clubId: number, userId: number): Promise<void> {
    // Check if coordinator
    const isCoordinator = await this.prisma.clubCoordinator.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    if (isCoordinator) {
      throw new ForbiddenException('Coordinators cannot leave the club directly');
    }

    // Remove pending coordinator requests for this club
    const pendingRequest = await this.prisma.approvalRequest.findFirst({
      where: {
        userId,
        clubId,
        requestedRole: UserRole.COORDINATOR,
        status: 'PENDING',
      },
    });
    if (pendingRequest) {
      await this.prisma.approvalRequest.delete({ where: { id: pendingRequest.id } });
      // Notify mentor
      const club = await this.prisma.club.findUnique({
        where: { id: clubId },
        include: { mentors: true },
      });
      for (const mentor of club.mentors) {
        await this.notificationService.sendCoordinatorApplicationNotification({
          userName: mentor.name,
          userEmail: mentor.email,
          clubName: club.name,
          clubId: club.id,
          status: 'REJECTED', // Using REJECTED as REMOVED is not in enum, or cast if needed. Let's use REJECTED which conveys removal/denial.
          additionalMessage: `Member ${userId} left the club, coordinator request removed.`,
        });
      }
    }

    await this.prisma.clubMember.delete({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    // Update member count
    await this.prisma.club.update({
      where: { id: clubId },
      data: { memberCount: { decrement: 1 } }
    });

    // Invalidate cache
    await this.redis.del(`club:${clubId}`);
  }

  async removeMember(clubId: number, memberId: number, removedBy: number): Promise<void> {
    // 1. Fetch the user performing the action
    const remover = await this.prisma.user.findUnique({ where: { id: removedBy } });
    if (!remover) throw new ForbiddenException('User not found');

    // 2. Fetch the club to check roles within it
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      include: {
        coordinators: true,
        mentors: true,
        convenor: true,
      }
    });
    if (!club) throw new NotFoundException('Club not found');

    // 3. Determine Remover's Role in the Club
    const isRemoverAdmin = remover.role === UserRole.ADMIN;
    const isRemoverFaculty = remover.role === UserRole.FACULTY; // General faculty role check
    // Ideally check if specific mentor/convenor, but requirement says "Faculty... should be able to remove"
    // We can assume any Faculty with access (Managed Club) is valid, 
    // OR strictly check if they are Mentor/Convenor of THIS club.
    // Given the endpoint guards will handle general access, we'll refine logic here:

    const isRemoverCoordinator = club.coordinators.some(c => c.userId === removedBy);
    const isRemoverMentor = club.mentors.some(m => m.id === removedBy);
    const isRemoverConvenor = club.convenorId === removedBy;
    const isRemoverAuthority = isRemoverAdmin || isRemoverMentor || isRemoverConvenor;

    if (!isRemoverAuthority && !isRemoverCoordinator) {
      throw new ForbiddenException('You do not have permission to remove members');
    }

    // 4. Determine Target's Role in the Club
    const isTargetCoordinator = club.coordinators.some(c => c.userId === memberId);
    const isTargetMentor = club.mentors.some(m => m.id === memberId);
    const isTargetConvenor = club.convenorId === memberId;

    // Perform Removal
    await this.prisma.$transaction(async (prisma) => {
      // If coordinator, remove from coordinator table
      if (isTargetCoordinator) {
        await prisma.clubCoordinator.delete({
          where: { clubId_userId: { clubId, userId: memberId } }
        });
      }
      // Remove from members
      await prisma.clubMember.delete({
        where: { clubId_userId: { clubId, userId: memberId } }
      });
      // Decrement count
      await prisma.club.update({
        where: { id: clubId },
        data: { memberCount: { decrement: 1 } }
      });
    });

    // Invalidate cache
    await this.redis.del(`club:${clubId}`);
  }



  async addCoordinator(clubId: number, userId: number, addedBy: number): Promise<void> {
    // Verify permission
    const addingUser = await this.prisma.user.findUnique({
      where: { id: addedBy },
    });

    if (!addingUser || !([UserRole.FACULTY, UserRole.ADMIN] as UserRole[]).includes(addingUser.role)) {
      throw new ForbiddenException('Only faculty or admin can add coordinators');
    }

    await this.prisma.$transaction(async (prisma) => {
      // Check if already coordinator
      const existingCoordinator = await prisma.clubCoordinator.findUnique({
        where: {
          clubId_userId: {
            clubId,
            userId,
          },
        },
      });

      if (existingCoordinator) {
        throw new BadRequestException('User is already a coordinator of this club');
      }

      // Add to coordinators
      await prisma.clubCoordinator.create({
        data: {
          clubId,
          userId,
        },
      });

      // Upgrade user role to COORDINATOR if they are currently MEMBER
      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      if (targetUser && targetUser.role === UserRole.MEMBER) {
          await prisma.user.update({
              where: { id: userId },
              data: { role: UserRole.COORDINATOR }
          });
      }

      // Ensure user is also a member
      const existingMember = await prisma.clubMember.findUnique({
        where: {
          clubId_userId: {
            clubId,
            userId,
          },
        },
      });

      if (!existingMember) {
        await prisma.clubMember.create({
          data: {
            clubId,
            userId,
          },
        });
        
        // Increment member count
        await prisma.club.update({
          where: { id: clubId },
          data: { memberCount: { increment: 1 } }
        });
      }
    });

    // Invalidate cache
    await this.redis.del(`club:${clubId}`);
  }

  async removeCoordinator(clubId: number, userId: number, removedBy: number): Promise<void> {
    // Verify permission
    const removingUser = await this.prisma.user.findUnique({
      where: { id: removedBy },
    });

    if (!removingUser || !([UserRole.FACULTY, UserRole.ADMIN] as UserRole[]).includes(removingUser.role)) {
      throw new ForbiddenException('Only faculty or admin can remove coordinators');
    }

    await this.prisma.clubCoordinator.delete({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    // Invalidate cache
    await this.redis.del(`club:${clubId}`);
  }

  async applyAsCoordinator(clubId: number, userId: number, reason: string): Promise<any> {
    // Check if club exists
    const club = await this.findById(clubId);

    // Check if user is a member
    const membership = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You must be a member to apply as coordinator');
    }

    // Check if already a coordinator
    const existingCoordinator = await this.prisma.clubCoordinator.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    if (existingCoordinator) {
      throw new ForbiddenException('You are already a coordinator');
    }

    // Check if there's already a pending application
    const pendingRequest = await this.prisma.approvalRequest.findFirst({
      where: {
        userId,
        clubId,
        requestedRole: 'COORDINATOR',
        status: 'PENDING',
      },
    });

    if (pendingRequest) {
      throw new ForbiddenException('You already have a pending coordinator application');
    }

    // Create approval request
    const approvalRequest = await this.prisma.approvalRequest.create({
      data: {
        userId,
        clubId,
        requestedRole: 'COORDINATOR',
        reason,
        status: 'PENDING',
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
        club: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    });

    return approvalRequest;
  }

  async getClubStats(clubId: number): Promise<any> {
    const club = await this.findById(clubId);

    const stats = await this.prisma.$transaction([
      // Total members
      this.prisma.clubMember.count({
        where: { clubId },
      }),
      // Total activities
      this.prisma.activity.count({
        where: { clubId },
      }),
      // Upcoming activities
      this.prisma.activity.count({
        where: {
          clubId,
          startDate: {
            gte: new Date(),
          },
        },
      }),
      // Total quizzes
      this.prisma.quiz.count({
        where: { clubId },
      }),
      // Total quiz attempts across all quizzes
      this.prisma.quizAttempt.count({
        where: {
          quiz: {
            clubId,
          },
        },
      }),
      // Recent comments count (last 7 days)
      this.prisma.comment.count({
        where: {
          clubId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Recent member joins (last 10)
      this.prisma.clubMember.findMany({
        where: { clubId },
        orderBy: { joinedAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
    ]);

    return {
      club: {
        id: club.id,
        name: club.name,
        category: club.category,
      },
      totalMembers: stats[0],
      totalActivities: stats[1],
      upcomingActivities: stats[2],
      totalQuizzes: stats[3],
      totalQuizAttempts: stats[4],
      recentCommentsCount: stats[5],
      recentMembers: stats[6],
    };
  }

  async exportMembersToExcel(clubId: number, userId: number): Promise<Buffer> {
    // Verify user is coordinator, faculty, or admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const isCoordinator = await this.prisma.clubCoordinator.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    if (!isCoordinator && user?.role !== UserRole.ADMIN && user?.role !== UserRole.FACULTY) {
      throw new ForbiddenException('Only coordinators, faculty, or admins can export member data');
    }

    const members = await this.prisma.clubMember.findMany({
      where: { clubId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            universityId: true,
            department: true,
            year: true,
            phone: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    // Create Excel workbook using exceljs
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Members');

    // Set column headers
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'University ID', key: 'universityId', width: 15 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Joined Date', key: 'joinedAt', width: 15 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add member data
    members.forEach((member) => {
      worksheet.addRow({
        name: member.user.name,
        email: member.user.email,
        universityId: member.user.universityId || 'N/A',
        department: member.user.department,
        year: member.user.year || 'N/A',
        phone: member.user.phone || 'N/A',
        joinedAt: member.joinedAt.toLocaleDateString(),
      });
    });

    return await workbook.xlsx.writeBuffer() as Buffer;
  }
}