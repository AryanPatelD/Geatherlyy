import { Module } from '@nestjs/common';
import { DataManagementController } from './data-management.controller';
import { DataManagementService } from './data-management.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../cache/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [DataManagementController],
  providers: [DataManagementService],
  exports: [DataManagementService],
})
export class DataManagementModule {}
