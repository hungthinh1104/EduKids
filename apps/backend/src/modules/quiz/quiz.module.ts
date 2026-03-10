import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { QuizController } from "./quiz.controller";
import { QuizService } from "./quiz.service";
import { QuizRepository } from "./repositories/quiz.repository";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  imports: [
    CacheModule.register({
      ttl: 3600000, // 1 hour in milliseconds
      max: 200, // Max 200 quiz sessions in cache
    }),
  ],
  controllers: [QuizController],
  providers: [QuizService, QuizRepository, PrismaService],
  exports: [QuizService, QuizRepository],
})
export class QuizModule {}
