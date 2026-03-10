import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PronunciationController } from './pronunciation.controller';
import { PronunciationService } from './pronunciation.service';
import { PronunciationRepository } from './repositories/pronunciation.repository';
import { PronunciationAssessmentService } from './pronunciation-assessment.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 3600000, // 1 hour in milliseconds
      max: 100, // Max 100 pronunciation pronunciations in cache
    }),
  ],
  controllers: [PronunciationController],
  providers: [
    PronunciationService,
    PronunciationRepository,
    PronunciationAssessmentService,
    PrismaService,
  ],
  exports: [PronunciationService, PronunciationRepository],
})
export class PronunciationModule {}