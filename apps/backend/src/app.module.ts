import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { SentryModule } from "@sentry/nestjs/setup";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ContentModule } from "./modules/content/content.module";
import { GamificationModule } from "./modules/gamification/gamification.module";
import { LearningModule } from "./modules/learning/learning.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PronunciationModule } from "./modules/pronunciation/pronunciation.module";
import { QuizModule } from "./modules/quiz/quiz.module";
import { ReportModule } from "./modules/report/report.module";
import { RecommendationModule } from "./modules/recommendation/recommendation.module";
import { MediaModule } from "./modules/media/media.module";
import { SystemModule } from "./modules/system/system.module";
import { CustomThrottlerGuard } from "./common/guards/throttler.guard";
import { FlashcardModule } from "./modules/flashcard/flashcard.module";
import { VocabularyReviewModule } from "./modules/vocabulary-review/vocabulary-review.module";
import { ChildProfileModule } from "./modules/child-profile/child-profile.module";
import { CmsModule } from "./modules/cms/cms.module";
import { AdminAnalyticsModule } from "./modules/admin-analytics/admin-analytics.module";
import { UsersModule } from "./modules/users/users.module";
import { RootController } from "./root.controller";
import { ConfigModule } from '@nestjs/config';
@Module({
  controllers: [RootController],
  imports: [
      // 1. Thêm ConfigModule lên đầu danh sách imports
          ConfigModule.forRoot({
            isGlobal: true, // Để các module khác đều dùng được mà không cần import lại
            envFilePath: '.env', // Trỏ trực tiếp vào file .env bạn vừa rename
          }),
    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per 60 seconds (default)
      },
    ]),
    SentryModule.forRoot(),
    PrismaModule,
    AuthModule,
    ContentModule,
    LearningModule,
    QuizModule,
    PronunciationModule,
    GamificationModule,
    AnalyticsModule,
    ReportModule,
    RecommendationModule,
    MediaModule,
    SystemModule,
    FlashcardModule,
    VocabularyReviewModule,
    ChildProfileModule,
    CmsModule,
    AdminAnalyticsModule,
    UsersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
