import { Module } from "@nestjs/common";
import { ContentController } from "./content.controller";
import { ContentService } from "./content.service";
import { TopicRepository } from "./repositories/topic.repository";
import { VocabularyRepository } from "./repositories/vocabulary.repository";
import { PrismaModule } from "../../prisma/prisma.module";
import { LearningModule } from "../learning/learning.module";

@Module({
  imports: [PrismaModule, LearningModule],
  controllers: [ContentController],
  providers: [ContentService, TopicRepository, VocabularyRepository],
  exports: [ContentService, TopicRepository, VocabularyRepository],
})
export class ContentModule {}
