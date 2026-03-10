import { Module } from "@nestjs/common";
import { VocabularyReviewService } from "./service/vocabulary-review.service";
import { VocabularyReviewController } from "./controller/vocabulary-review.controller";
import { VocabularyReviewRepository } from "./repository/vocabulary-review.repository";
import { SpacedRepetitionService } from "./service/spaced-repetition.service";

@Module({
  providers: [
    VocabularyReviewService,
    VocabularyReviewRepository,
    SpacedRepetitionService,
  ],
  controllers: [VocabularyReviewController],
  exports: [VocabularyReviewService, SpacedRepetitionService],
})
export class VocabularyReviewModule {}
