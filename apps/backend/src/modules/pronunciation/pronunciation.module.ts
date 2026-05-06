import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PronunciationController } from './pronunciation.controller';
import { PronunciationService } from './pronunciation.service';
import { PronunciationRepository } from './repositories/pronunciation.repository';
import { PronunciationAssessmentService } from './pronunciation-assessment.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PronunciationProviderRegistryService } from './providers/pronunciation-provider-registry.service';
import { CustomPronunciationProvider } from './providers/custom-pronunciation.provider';
import { AzureSpeechPronunciationProvider } from './providers/azure-speech-pronunciation.provider';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    PrismaModule,
    GamificationModule,
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
    PronunciationProviderRegistryService,
    CustomPronunciationProvider,
    AzureSpeechPronunciationProvider,
  ],
  exports: [PronunciationService, PronunciationRepository],
})
export class PronunciationModule {}