import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(file: Express.Multer.File, folder: string = 'gatherly'): Promise<any> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      upload.end(file.buffer);
    });
  }

  async uploadMultipleImages(files: Express.Multer.File[], folder: string = 'gatherly'): Promise<any[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'gatherly', resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'): Promise<any> {
    return new Promise((resolve, reject) => {
      // Use provided resourceType, or fallback to auto logic if needed (though current caller provides it)
      
      const upload = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          // Only apply transformations for images
          ...(resourceType === 'image' && {
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' }
            ]
          })
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      upload.end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<any> {
    return cloudinary.uploader.destroy(publicId);
  }
}
