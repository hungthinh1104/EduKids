import {
  PronunciationAssessmentMode,
  PronunciationAssessmentProvider,
  PronunciationAssessmentResultDto,
} from './dto/pronunciation-assessment.dto';
import { describe, expect, it, jest } from '@jest/globals';
import { PronunciationAssessmentService } from './pronunciation-assessment.service';

describe('PronunciationAssessmentService', () => {
  const input = {
    mode: PronunciationAssessmentMode.WORD,
    word: 'dog',
    referenceText: 'dog',
  };

  it('uses Azure provider when configured and available', async () => {
    const azureResult: PronunciationAssessmentResultDto = {
      mode: PronunciationAssessmentMode.WORD,
      provider: PronunciationAssessmentProvider.AZURE_SPEECH,
      overallScore: 90,
      accuracyScore: 90,
      fluencyScore: 90,
      referenceText: 'dog',
      words: [],
      passed: true,
    };

    const providerRegistry = {
      resolveConfiguredProvider: jest
        .fn()
        .mockReturnValue(PronunciationAssessmentProvider.AZURE_SPEECH),
    };
    const customProvider = { assess: jest.fn(async (_input: unknown) => null) };
    const azureProvider = {
      assess: jest.fn(async (_input: unknown) => azureResult),
    };

    const service = new PronunciationAssessmentService(
      providerRegistry as any,
      customProvider as any,
      azureProvider as any,
    );

    const result = await service.buildAssessment(input);

    expect(azureProvider.assess).toHaveBeenCalledWith(input);
    expect(customProvider.assess).not.toHaveBeenCalled();
    expect(result.provider).toBe(PronunciationAssessmentProvider.AZURE_SPEECH);
  });

  it('falls back to custom provider when azure returns null', async () => {
    const customResult: PronunciationAssessmentResultDto = {
      mode: PronunciationAssessmentMode.WORD,
      provider: PronunciationAssessmentProvider.CUSTOM,
      overallScore: 75,
      accuracyScore: 75,
      fluencyScore: 75,
      referenceText: 'dog',
      words: [],
      passed: false,
    };

    const providerRegistry = {
      resolveConfiguredProvider: jest
        .fn()
        .mockReturnValue(PronunciationAssessmentProvider.AZURE_SPEECH),
    };
    const customProvider = {
      assess: jest.fn(async (_input: unknown) => customResult),
    };
    const azureProvider = { assess: jest.fn(async (_input: unknown) => null) };

    const service = new PronunciationAssessmentService(
      providerRegistry as any,
      customProvider as any,
      azureProvider as any,
    );

    const result = await service.buildAssessment(input);

    expect(azureProvider.assess).toHaveBeenCalledWith(input);
    expect(customProvider.assess).toHaveBeenCalledWith(input);
    expect(result.provider).toBe(PronunciationAssessmentProvider.CUSTOM);
  });
});
