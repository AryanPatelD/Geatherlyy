import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Resource, Prisma, UserRole } from '@prisma/client';

@Injectable()
export class ResourcesService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async create(data: Prisma.ResourceCreateInput): Promise<Resource> {
    return this.prisma.resource.create({
      data,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  async findAll(filters?: {
    clubId?: number;
    type?: string;
    search?: string;
    skip?: number;
    take?: number;
  }): Promise<Resource[]> {
    const where: Prisma.ResourceWhereInput = {};

    if (filters?.clubId) {
      where.clubId = filters.clubId;
    }

    if (filters?.type) {
      where.type = filters.type as any;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.resource.findMany({
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
        uploader: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: number): Promise<Resource> {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: {
        club: true,
        uploader: {
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

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    return resource;
  }

  async update(id: number, data: Prisma.ResourceUpdateInput): Promise<Resource> {
    return this.prisma.resource.update({
      where: { id },
      data,
      include: {
        club: true,
        uploader: true,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.resource.delete({
      where: { id },
    });
  }

  async canUserModifyResource(resourceId: number, userId: number): Promise<boolean> {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
      include: {
        club: {
          include: {
            coordinators: true,
          },
        },
      },
    });

    if (!resource) {
      return false;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    // Admin and Faculty can modify any resource
    if (([UserRole.ADMIN, UserRole.FACULTY] as UserRole[]).includes(user.role)) {
      return true;
    }

    // Uploader can modify their own resource
    if (resource.uploadedBy === userId) {
      return true;
    }

    // Coordinator can modify their club's resources
    if (user.role === UserRole.COORDINATOR) {
      const isCoordinator = resource.club.coordinators.some(
        (coord) => coord.userId === userId,
      );
      return isCoordinator;
    }

    return false;
  }

  async incrementDownloads(id: number): Promise<void> {
    await this.prisma.resource.update({
      where: { id },
      data: {
        downloads: {
          increment: 1,
        },
      },
    });
  }

  async isUserClubCoordinator(userId: number, clubId: number): Promise<boolean> {
    const coordinator = await this.prisma.clubCoordinator.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });
    return !!coordinator;
  }
}





