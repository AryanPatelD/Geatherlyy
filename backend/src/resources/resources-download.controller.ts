import {
  Controller,
  Get,
  Param,
  Res,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { ResourcesService } from './resources.service';
import * as https from 'https';
import * as http from 'http';

@Controller('resources')
export class ResourcesDownloadController {
  constructor(private readonly resourcesService: ResourcesService) {}

  private getContentTypeAndExtension(type: string): { contentType: string; extension: string } {
    switch (type) {
      case 'PDF':
        return { contentType: 'application/pdf', extension: 'pdf' };
      case 'IMAGE':
        return { contentType: 'image/jpeg', extension: 'jpg' };
      case 'ZIP':
        return { contentType: 'application/zip', extension: 'zip' };
      case 'VIDEO':
        return { contentType: 'video/mp4', extension: 'mp4' };
      default:
        return { contentType: 'application/octet-stream', extension: 'bin' };
    }
  }

  private followRedirectsAndDownload(
    url: string, 
    res: Response, 
    filename: string, 
    contentType: string,
    resourceId: number,
    maxRedirects: number = 5,
  ): void {
    if (maxRedirects <= 0) {
      res.status(500).json({ message: 'Too many redirects' });
      return;
    }

    const client = url.startsWith('https') ? https : http;
    
    const request = client.get(url, (response) => {
      // Handle redirects
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        this.followRedirectsAndDownload(
          response.headers.location, 
          res, 
          filename, 
          contentType, 
          resourceId,
          maxRedirects - 1
        );
        return;
      }

      // Check if the response is successful
      if (response.statusCode !== 200) {
        console.error('Download failed with status:', response.statusCode);
        res.status(404).json({ message: 'Failed to download resource' });
        return;
      }

      // Use content-type from response if available
      const responseContentType = response.headers['content-type'] || contentType;
      
      // Set headers for download with proper filename
      res.setHeader('Content-Type', responseContentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"`,
      );
      if (response.headers['content-length']) {
        res.setHeader('Content-Length', response.headers['content-length']);
      }

      // Pipe the response directly to the client
      response.pipe(res);

      // Increment download count when done
      response.on('end', async () => {
        await this.resourcesService.incrementDownloads(resourceId);
      });
    });

    request.on('error', (error) => {
      console.error('Download error:', error);
      res.status(500).json({ message: 'Failed to download resource' });
    });
  }

  @Get(':id/download')
  async downloadResource(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    // Get resource from database
    const resource = await this.resourcesService.findById(id);
    
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    if (!resource.url) {
      throw new NotFoundException('Resource URL not found');
    }

    try {
      // Determine content type and extension based on resource type
      const { contentType, extension } = this.getContentTypeAndExtension(resource.type);
      const filename = `${resource.title}.${extension}`;

      // Use the redirect-following download method
      this.followRedirectsAndDownload(resource.url, res, filename, contentType, id);
    } catch (error) {
      console.error('Download error:', error);
      throw new NotFoundException('Failed to download resource');
    }
  }
}
