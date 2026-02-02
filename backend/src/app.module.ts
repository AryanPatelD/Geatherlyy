import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClubsModule } from './clubs/clubs.module';
import { ActivitiesModule } from './activities/activities.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { LeaderboardsModule } from './leaderboards/leaderboards.module';
import { ResourcesModule } from './resources/resources.module';
import { CommentsModule } from './comments/comments.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { RemovalRequestsModule } from './removal-requests/removal-requests.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './cache/redis.module';
import { UploadModule } from './upload/upload.module';
import { MailerModule } from './common/mailer/mailer.module';
import { NotificationModule } from './common/notifications/notification.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting (Security: DoS Protection)
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 1000, // 1000 requests per minute (High limit for shared University WiFi)
    }]),

    // Core modules
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    ClubsModule,
    ActivitiesModule,
    QuizzesModule,
    LeaderboardsModule,
    ResourcesModule,
    CommentsModule,
    ApprovalsModule,
    AnalyticsModule,
    ApprovalsModule,
    AnalyticsModule,
    UploadModule,
    RemovalRequestsModule,
    MailerModule,
    NotificationModule,
  ],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}


