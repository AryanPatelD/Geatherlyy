import { Module } from '@nestjs/common';
import { RemovalRequestsController } from './removal-requests.controller';
import { RemovalRequestsService } from './removal-requests.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RemovalRequestsController],
  providers: [RemovalRequestsService],
  exports: [RemovalRequestsService],
})
export class RemovalRequestsModule {}
