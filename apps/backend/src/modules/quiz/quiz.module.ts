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

@Module({
  imports: [
    CacheModule.register({
      ttl: 3600000, // 1 hour in milliseconds
      max: 200, // Max 200 quiz sessions in cache
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
