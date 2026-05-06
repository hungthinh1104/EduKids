import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { QuizController } from "./quiz.controller";
import { QuizService } from "./quiz.service";
import { QuizRepository } from "./repositories/quiz.repository";
import { PrismaService } from "../../prisma/prisma.service";
import { QuizSessionService } from "./services/quiz-session.service";
import { QuizScoringService } from "./services/quiz-scoring.service";
import { QuizQuestionService } from "./services/quiz-question.service";
import { QuizEventPublisherService } from "./services/quiz-event-publisher.service";
import { GamificationModule } from "../gamification/gamification.module";

@Module({
  imports: [
    GamificationModule,
    CacheModule.register({
      ttl: 3600000,
      max: 200,
    }),
  ],
  controllers: [QuizController],
  providers: [
    QuizService,
    QuizRepository,
    QuizSessionService,
    QuizScoringService,
    QuizQuestionService,
    QuizEventPublisherService,
    PrismaService,
  ],
  exports: [QuizService, QuizRepository],
})
export class QuizModule {}
