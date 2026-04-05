import { Injectable } from '@nestjs/common';
import { PronunciationAssessmentProvider } from '../dto/pronunciation-assessment.dto';

@Injectable()
export class PronunciationProviderRegistryService {
  resolveConfiguredProvider(): PronunciationAssessmentProvider {
    const configuredProvider = process.env.PRONUNCIATION_PROVIDER?.toUpperCase();

    if (configuredProvider === PronunciationAssessmentProvider.AZURE_SPEECH) {
      return PronunciationAssessmentProvider.AZURE_SPEECH;
    }

    if (configuredProvider === PronunciationAssessmentProvider.GOOGLE_SPEECH) {
      return PronunciationAssessmentProvider.GOOGLE_SPEECH;
    }

    return PronunciationAssessmentProvider.CUSTOM;
  }
}
