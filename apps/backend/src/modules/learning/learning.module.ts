import { Module } from "@nestjs/common";
import { LearningController } from "./learning.controller";
import { LearningService } from "./learning.service";
import { LearningProgressRepository } from "./repositories/learning-progress.repository";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [LearningController],
  providers: [LearningService, LearningProgressRepository],
  exports: [LearningService, LearningProgressRepository],
})
export class LearningModule {}
