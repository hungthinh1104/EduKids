import { Injectable } from '@nestjs/common';
import {
  PronunciationAssessmentProvider,
  PronunciationAssessmentResultDto,
  WordAssessmentDto,
} from './dto/pronunciation-assessment.dto';

export interface BuildAssessmentInput {
  confidenceScore: number;
  word: string;
  targetIpa?: string | null;
  recognizedText?: string;
  recognizedIpa?: string;
}

@Injectable()
export class PronunciationAssessmentService {
  buildAssessment(input: BuildAssessmentInput): PronunciationAssessmentResultDto {
    const overallScore = this.clampScore(input.confidenceScore);
    const accuracyScore = this.clampScore(overallScore + 2);
    const fluencyScore = this.clampScore(overallScore - 3);
    const completenessScore = this.clampScore(overallScore + 1);
    const prosodyScore = this.clampScore(overallScore - 4);

    const targetIpa = input.targetIpa || '';
    const spokenIpa = input.recognizedIpa || targetIpa;

    const wordAssessment: WordAssessmentDto = {
      word: input.word,
      targetIpa,
      spokenIpa,
      score: overallScore,
    };

    const provider = this.resolveProvider();

    return {
      provider,
      overallScore,
      accuracyScore,
      fluencyScore,
      completenessScore,
      prosodyScore,
      recognizedText: input.recognizedText || input.word,
      recognizedIpa: spokenIpa || undefined,
      words: [wordAssessment],
      passed: overallScore >= 80,
    };
  }

  private resolveProvider(): PronunciationAssessmentProvider {
    const configuredProvider = process.env.PRONUNCIATION_PROVIDER?.toUpperCase();

    if (configuredProvider === PronunciationAssessmentProvider.AZURE_SPEECH) {
      return PronunciationAssessmentProvider.AZURE_SPEECH;
    }

    if (configuredProvider === PronunciationAssessmentProvider.GOOGLE_SPEECH) {
      return PronunciationAssessmentProvider.GOOGLE_SPEECH;
    }

    return PronunciationAssessmentProvider.CUSTOM;
  }

  private clampScore(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
}
