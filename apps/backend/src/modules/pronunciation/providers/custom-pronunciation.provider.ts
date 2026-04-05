import { Injectable } from '@nestjs/common';
import {
  PronunciationAssessmentMode,
  PronunciationAssessmentProvider,
  PronunciationAssessmentResultDto,
  PronunciationWordErrorType,
  WordAssessmentDto,
} from '../dto/pronunciation-assessment.dto';
import type { BuildAssessmentInput } from '../pronunciation-assessment.service';
import type { PronunciationProvider } from './pronunciation-provider.interface';

@Injectable()
export class CustomPronunciationProvider implements PronunciationProvider {
  readonly name = PronunciationAssessmentProvider.CUSTOM;

  async assess(
    input: BuildAssessmentInput,
  ): Promise<PronunciationAssessmentResultDto | null> {
    const fallbackScore =
      typeof input.confidenceScore === 'number'
        ? input.confidenceScore
        : this.estimateScoreFromText(input.referenceText, input.recognizedText);

    const overallScore = this.clampScore(fallbackScore);
    const accuracyScore = this.clampScore(overallScore + 2);
    const fluencyScore = this.clampScore(overallScore - 3);
    const completenessScore = this.clampScore(
      this.calculateCompletenessFromText(input.referenceText, input.recognizedText),
    );
    const prosodyScore = this.clampScore(overallScore - 4);

    return {
      mode: input.mode || PronunciationAssessmentMode.WORD,
      provider: PronunciationAssessmentProvider.CUSTOM,
      overallScore,
      accuracyScore,
      fluencyScore,
      completenessScore,
      prosodyScore,
      recognizedText: input.recognizedText || input.referenceText,
      recognizedIpa: input.recognizedIpa || input.targetIpa || undefined,
      referenceText: input.referenceText,
      words: this.buildCustomWords(input, overallScore),
      passed: overallScore >= 80,
    };
  }

  private buildCustomWords(
    input: BuildAssessmentInput,
    score: number,
  ): WordAssessmentDto[] {
    const referenceWords = this.normalizeTextToWords(input.referenceText);
    if (referenceWords.length <= 1) {
      return [
        {
          word: input.word,
          targetIpa: input.targetIpa || '',
          spokenIpa: input.recognizedIpa || input.targetIpa || '',
          score,
          errorType:
            (input.recognizedText || input.word).trim().toLowerCase() ===
            input.referenceText.trim().toLowerCase()
              ? PronunciationWordErrorType.NONE
              : PronunciationWordErrorType.MISPRONUNCIATION,
          isMatch:
            (input.recognizedText || input.word).trim().toLowerCase() ===
            input.referenceText.trim().toLowerCase(),
        },
      ];
    }

    const spokenWords = this.normalizeTextToWords(input.recognizedText || input.referenceText);
    return referenceWords.map((word, index) => ({
      word,
      targetIpa: '',
      spokenIpa: '',
      score,
      errorType:
        spokenWords[index] && spokenWords[index] === word
          ? PronunciationWordErrorType.NONE
          : spokenWords[index]
            ? PronunciationWordErrorType.MISPRONUNCIATION
            : PronunciationWordErrorType.OMISSION,
      isMatch: spokenWords[index] === word,
    }));
  }

  private estimateScoreFromText(referenceText: string, recognizedText?: string): number {
    const referenceWords = this.normalizeTextToWords(referenceText);
    const spokenWords = this.normalizeTextToWords(recognizedText || '');

    if (referenceWords.length === 0) return 0;
    if (spokenWords.length === 0) return 25;

    const matches = referenceWords.filter((word, index) => spokenWords[index] === word).length;
    return this.clampScore((matches / referenceWords.length) * 100);
  }

  private calculateCompletenessFromText(referenceText: string, recognizedText?: string): number {
    const referenceWords = this.normalizeTextToWords(referenceText);
    if (referenceWords.length === 0) return 0;

    const spokenWords = this.normalizeTextToWords(recognizedText || '');
    const matched = referenceWords.filter((word, index) => spokenWords[index] === word).length;
    return (matched / referenceWords.length) * 100;
  }

  private normalizeTextToWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[!"#$%&()*+,./:;<=>?@[\\\]^_`{|}~-]+/g, ' ')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);
  }

  private clampScore(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
}
