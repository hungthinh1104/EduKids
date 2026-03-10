import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ChildModule } from "./modules/child/child.module";
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
import { MediaValidationModule } from "./modules/media-validation/media-validation.module";

@Module({
  imports: [
    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per 60 seconds (default)
      },
    ]),
    PrismaModule,
    AuthModule,
    ChildModule,
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
    MediaValidationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
