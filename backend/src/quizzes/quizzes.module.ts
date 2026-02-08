import { Module } from '@nestjs/common';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../cache/redis.module';

import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [PrismaModule, RedisModule, ActivityModule],
  controllers: [QuizzesController],
  providers: [QuizzesService],
  exports: [QuizzesService],
})
export class QuizzesModule {}


