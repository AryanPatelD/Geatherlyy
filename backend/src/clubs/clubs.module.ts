import { Module } from '@nestjs/common';
import { ClubsController } from './clubs.controller';
import { ClubsService } from './clubs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../cache/redis.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [PrismaModule, RedisModule, CloudinaryModule, ActivityModule],
  controllers: [ClubsController],
  providers: [ClubsService],
  exports: [ClubsService],
})
export class ClubsModule {}


