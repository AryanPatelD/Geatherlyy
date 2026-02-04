import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('resources')
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all resources' })
  @ApiResponse({ status: 200, description: 'Returns list of resources' })
  async getAllResources(
    @Query('clubId') clubId?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.resourcesService.findAll({
      clubId: clubId ? parseInt(clubId) : undefined,
      type,
      search,
      skip: skip ? parseInt(skip.toString()) : undefined,
      take: take ? parseInt(take.toString()) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get resource by ID' })
  @ApiResponse({ status: 200, description: 'Returns resource details' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async getResourceById(@Param('id', ParseIntPipe) id: number) {
    return this.resourcesService.findById(id);
  }

  @Post(':id/download')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Increment download count' })
  @ApiResponse({ status: 200, description: 'Download count incremented' })
  async incrementDownloads(@Param('id', ParseIntPipe) id: number) {
    await this.resourcesService.incrementDownloads(id);
    return { message: 'Download recorded' };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR, UserRole.FACULTY, UserRole.ADMIN, UserRole.MEMBER) // Allow MEMBER to enter, but filter below
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a new resource (Coordinator/Faculty/Admin only)' })
  @ApiResponse({ status: 201, description: 'Resource uploaded successfully' })
  async createResource(
    @Body() createData: any,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    // Check permissions dynamically
    // If user is basic MEMBER, they must be a coordinator of the specific club
    if (req.user.role === UserRole.MEMBER) {
        const clubId = parseInt(createData.clubId);
        if (!clubId) throw new BadRequestException('Club ID is required');
        
        const isCoordinator = await this.resourcesService.isUserClubCoordinator(req.user.id, clubId);
        if (!isCoordinator) {
            throw new ForbiddenException('You must be a coordinator of this club to upload resources');
        }
    }

    // Validate file if uploaded
    if (file) {
      // Check file size (50MB = 50 * 1024 * 1024 bytes)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new ForbiddenException('File size exceeds 50MB limit');
      }
      
      // Removed Restricted MIME types to allow ZIP and other files
    }

    let fileUrl = createData.url;
    let fileSize = 0;
    // Default to provided type or determine later
    let fileType = createData.type || 'DOCUMENT'; 

    // If file is uploaded, use Cloudinary
    if (file) {
      try {
        // Use 'raw' resource_type for non-image/video files like ZIP, PDF
        const isImage = file.mimetype.startsWith('image/');
        const isPdfOrZip = file.mimetype === 'application/pdf' || 
                           file.mimetype.includes('zip') || 
                           file.mimetype.includes('compressed');
        
        // Determine resource type for Cloudinary
        let resourceType: 'image' | 'raw' | 'auto' = 'auto';
        if (isImage) {
          resourceType = 'image';
        } else if (isPdfOrZip) {
          resourceType = 'raw';
        }
        
        console.log('Uploading to Cloudinary... resourceType:', resourceType, 'mimetype:', file.mimetype);
        
        const uploadResult = await this.resourcesService['cloudinary'].uploadFile(
          file, 
          'gatherly/resources', 
          resourceType 
        );
        
        console.log('Cloudinary Result:', uploadResult);

        fileUrl = uploadResult.secure_url;
        fileSize = file.size;
        
        // Determine file type from mimetype
        if (file.mimetype === 'application/pdf') {
          fileType = 'PDF';
        } else if (file.mimetype.startsWith('image/')) {
          fileType = 'IMAGE';
        } else if (file.mimetype.includes('zip') || file.mimetype.includes('compressed')) {
          fileType = 'ZIP'; 
        } else {
          fileType = 'OTHER';
        }
      } catch (err) {
        console.error('Cloudinary Upload Failed:', err);
        throw err;
      }
    }

    // Ensure we have a URL (either from upload or provided)
    if (!fileUrl) {
        throw new BadRequestException('File or URL is required');
    }

    console.log('Creating Resource with:', {
        title: createData.title,
        url: fileUrl,
        type: fileType
    });

    return this.resourcesService.create({
      title: createData.title,
      description: createData.description,
      type: fileType,
      url: fileUrl, 
      fileSize: fileSize,
      club: {
        connect: { id: parseInt(createData.clubId) },
      },
      uploader: {
        connect: { id: req.user.id },
      },
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update resource' })
  @ApiResponse({ status: 200, description: 'Resource updated successfully' })
  async updateResource(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: any,
    @Request() req,
  ) {
    const canModify = await this.resourcesService.canUserModifyResource(id, req.user.id);
    
    if (!canModify) {
      throw new ForbiddenException('You do not have permission to modify this resource');
    }

    return this.resourcesService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete resource' })
  @ApiResponse({ status: 204, description: 'Resource deleted successfully' })
  async deleteResource(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const canModify = await this.resourcesService.canUserModifyResource(id, req.user.id);
    
    if (!canModify) {
      throw new ForbiddenException('You do not have permission to delete this resource');
    }

    await this.resourcesService.delete(id);
  }
}


