import { Injectable } from '@nestjs/common';
import {
  PronunciationAssessmentMode,
  PronunciationAssessmentProvider,
  PronunciationAssessmentResultDto,
} from './dto/pronunciation-assessment.dto';
import { PronunciationProviderRegistryService } from './providers/pronunciation-provider-registry.service';
import { CustomPronunciationProvider } from './providers/custom-pronunciation.provider';
import { AzureSpeechPronunciationProvider } from './providers/azure-speech-pronunciation.provider';

export interface BuildAssessmentInput {
  confidenceScore?: number;
  mode: PronunciationAssessmentMode;
  word: string;
  referenceText: string;
  targetIpa?: string | null;
  recognizedText?: string;
  recognizedIpa?: string;
  audioBase64?: string;
  audioMimeType?: string;
}

@Injectable()
export class PronunciationAssessmentService {
  constructor(
    private readonly providerRegistry: PronunciationProviderRegistryService,
    private readonly customPronunciationProvider: CustomPronunciationProvider,
    private readonly azureSpeechPronunciationProvider: AzureSpeechPronunciationProvider,
  ) {}

  async buildAssessment(
    input: BuildAssessmentInput,
  ): Promise<PronunciationAssessmentResultDto> {
    const provider = this.providerRegistry.resolveConfiguredProvider();

    if (provider === PronunciationAssessmentProvider.AZURE_SPEECH) {
      const azureAssessment = await this.azureSpeechPronunciationProvider.assess(input);
      if (azureAssessment) {
        return azureAssessment;
      }
    }

    return (
      (await this.customPronunciationProvider.assess(input)) ??
      {
        mode: input.mode,
        provider: PronunciationAssessmentProvider.CUSTOM,
        overallScore: 0,
        accuracyScore: 0,
        fluencyScore: 0,
        completenessScore: 0,
        prosodyScore: 0,
        recognizedText: input.recognizedText || input.referenceText,
        referenceText: input.referenceText,
        words: [],
        passed: false,
      }
    );
  }
}
