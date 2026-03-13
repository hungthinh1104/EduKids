import { Injectable, Logger } from '@nestjs/common';
import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';
import {
  PhonemeAssessmentDto,
  PronunciationAssessmentProvider,
  PronunciationAssessmentResultDto,
  PronunciationWordErrorType,
  SyllableAssessmentDto,
  WordAssessmentDto,
} from './dto/pronunciation-assessment.dto';

export interface BuildAssessmentInput {
  confidenceScore: number;
  word: string;
  targetIpa?: string | null;
  recognizedText?: string;
  recognizedIpa?: string;
  audioBase64?: string;
  audioMimeType?: string;
}

@Injectable()
export class PronunciationAssessmentService {
  private readonly logger = new Logger(PronunciationAssessmentService.name);

  async buildAssessment(
    input: BuildAssessmentInput,
  ): Promise<PronunciationAssessmentResultDto> {
    const provider = this.resolveProvider();

    if (provider === PronunciationAssessmentProvider.AZURE_SPEECH) {
      const azureAssessment = await this.buildAzureAssessment(input);
      if (azureAssessment) {
        return azureAssessment;
      }
    }

    return this.buildCustomAssessment(input);
  }

  private buildCustomAssessment(
    input: BuildAssessmentInput,
  ): PronunciationAssessmentResultDto {
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

    return {
      provider: PronunciationAssessmentProvider.CUSTOM,
      overallScore,
      accuracyScore,
      fluencyScore,
      completenessScore,
      prosodyScore,
      recognizedText: input.recognizedText || input.word,
      recognizedIpa: spokenIpa || undefined,
      referenceText: input.word,
      words: [wordAssessment],
      passed: overallScore >= 80,
    };
  }

  private async buildAzureAssessment(
    input: BuildAssessmentInput,
  ): Promise<PronunciationAssessmentResultDto | null> {
    const subscriptionKey = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;

    if (!subscriptionKey || !region) {
      this.logger.warn(
        'AZURE_SPEECH provider selected but AZURE_SPEECH_KEY or AZURE_SPEECH_REGION is missing. Falling back to CUSTOM.',
      );
      return null;
    }

    if (!input.audioBase64) {
      this.logger.warn(
        'AZURE_SPEECH provider selected without audioBase64 payload. Falling back to CUSTOM.',
      );
      return null;
    }

    const audioBuffer = this.decodeAudioBase64(input.audioBase64);

    if (!audioBuffer) {
      this.logger.warn(
        'Unable to decode audioBase64 payload for Azure Speech assessment. Falling back to CUSTOM.',
      );
      return null;
    }

    const MAX_AUDIO_BYTES = 2 * 1024 * 1024; // 2 MB
    if (audioBuffer.length > MAX_AUDIO_BYTES) {
      this.logger.warn(
        `Audio payload too large (${audioBuffer.length} bytes, limit ${MAX_AUDIO_BYTES}). Falling back to CUSTOM.`,
      );
      return null;
    }

    let recognizer: speechsdk.SpeechRecognizer | null = null;

    try {
      const speechConfig = speechsdk.SpeechConfig.fromSubscription(
        subscriptionKey,
        region,
      );

      speechConfig.speechRecognitionLanguage =
        process.env.AZURE_SPEECH_LANGUAGE || 'en-US';
      speechConfig.outputFormat = speechsdk.OutputFormat.Detailed;

      const audioConfig = speechsdk.AudioConfig.fromWavFileInput(audioBuffer);
      recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

      const pronunciationConfig = new speechsdk.PronunciationAssessmentConfig(
        input.word,
        speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
        speechsdk.PronunciationAssessmentGranularity.Phoneme,
        true,
      );

      pronunciationConfig.applyTo(recognizer);

      const AZURE_TIMEOUT_MS = 8_000;
      const result = await Promise.race([
        new Promise<speechsdk.SpeechRecognitionResult>((resolve, reject) => {
          recognizer!.recognizeOnceAsync(resolve, reject);
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Azure Speech timed out after ${AZURE_TIMEOUT_MS}ms`)),
            AZURE_TIMEOUT_MS,
          ),
        ),
      ]);

      const rawJson = result.properties.getProperty(
        speechsdk.PropertyId.SpeechServiceResponse_JsonResult,
      );

      const parsed = rawJson ? (JSON.parse(rawJson) as Record<string, any>) : null;
      const bestResult = Array.isArray(parsed?.NBest) ? parsed.NBest[0] : null;
      const assessment =
        bestResult?.PronunciationAssessment ?? parsed?.PronunciationAssessment ?? {};
      const wordResults = Array.isArray(bestResult?.Words) ? bestResult.Words : [];

      const accuracyScore = this.clampScore(
        Number(assessment.AccuracyScore ?? input.confidenceScore),
      );
      const fluencyScore = this.clampScore(
        Number(assessment.FluencyScore ?? accuracyScore),
      );
      const completenessScore = this.clampScore(
        Number(assessment.CompletenessScore ?? accuracyScore),
      );
      const prosodyScore =
        typeof assessment.ProsodyScore === 'number'
          ? this.clampScore(assessment.ProsodyScore)
          : undefined;
      const overallScore = this.clampScore(
        Number(
          assessment.PronScore ??
            assessment.PronunciationScore ??
            accuracyScore,
        ),
      );

      const recognizedText =
        typeof bestResult?.Lexical === 'string' && bestResult.Lexical.trim().length > 0
          ? bestResult.Lexical
          : typeof parsed?.DisplayText === 'string' && parsed.DisplayText.trim().length > 0
            ? parsed.DisplayText
            : input.recognizedText || input.word;

      return {
        provider: PronunciationAssessmentProvider.AZURE_SPEECH,
        overallScore,
        accuracyScore,
        fluencyScore,
        completenessScore,
        prosodyScore,
        recognizedText,
        recognizedIpa: input.recognizedIpa,
        referenceText: input.word,
        words: this.mapAzureWords(wordResults, input),
        passed: overallScore >= 80,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Azure Speech error';
      this.logger.warn(
        `Azure Speech pronunciation assessment failed. Falling back to CUSTOM. ${message}`,
      );
      return null;
    } finally {
      recognizer?.close();
    }
  }

  private mapAzureWords(
    wordResults: Record<string, any>[],
    input: BuildAssessmentInput,
  ): WordAssessmentDto[] {
    if (!Array.isArray(wordResults) || wordResults.length === 0) {
      return [
        {
          word: input.word,
          targetIpa: input.targetIpa || '',
          spokenIpa: input.recognizedIpa || input.targetIpa || '',
          score: this.clampScore(input.confidenceScore),
          errorType: PronunciationWordErrorType.UNKNOWN,
          isMatch: true,
        },
      ];
    }

    return wordResults.map((wordResult) => ({
      word:
        typeof wordResult?.Word === 'string' && wordResult.Word.length > 0
          ? wordResult.Word
          : input.word,
      targetIpa: input.targetIpa || '',
      spokenIpa: input.recognizedIpa || input.targetIpa || '',
      score: this.clampScore(
        Number(
          wordResult?.PronunciationAssessment?.AccuracyScore ?? input.confidenceScore,
        ),
      ),
      errorType: this.mapAzureWordErrorType(wordResult?.PronunciationAssessment?.ErrorType),
      startMs: this.convertAzureTimeToMs(wordResult?.Offset),
      endMs: this.convertAzureTimeToMs(
        typeof wordResult?.Offset === 'number' && typeof wordResult?.Duration === 'number'
          ? wordResult.Offset + wordResult.Duration
          : undefined,
      ),
      isMatch:
        this.mapAzureWordErrorType(wordResult?.PronunciationAssessment?.ErrorType) ===
        PronunciationWordErrorType.NONE,
      syllables: this.mapAzureSyllables(wordResult?.Syllables),
      phonemes: this.mapAzurePhonemes(wordResult?.Phonemes),
    }));
  }

  private mapAzureSyllables(
    syllables: Record<string, any>[] | undefined,
  ): SyllableAssessmentDto[] | undefined {
    if (!Array.isArray(syllables) || syllables.length === 0) {
      return undefined;
    }

    return syllables.map((syllable) => ({
      syllable:
        typeof syllable?.Syllable === 'string' && syllable.Syllable.length > 0
          ? syllable.Syllable
          : '',
      score: this.clampScore(
        Number(syllable?.PronunciationAssessment?.AccuracyScore ?? 0),
      ),
      startMs: this.convertAzureTimeToMs(syllable?.Offset),
      endMs: this.convertAzureTimeToMs(
        typeof syllable?.Offset === 'number' && typeof syllable?.Duration === 'number'
          ? syllable.Offset + syllable.Duration
          : undefined,
      ),
    }));
  }

  private mapAzurePhonemes(
    phonemes: Record<string, any>[] | undefined,
  ): PhonemeAssessmentDto[] | undefined {
    if (!Array.isArray(phonemes) || phonemes.length === 0) {
      return undefined;
    }

    return phonemes.map((phoneme) => ({
      phoneme:
        typeof phoneme?.Phoneme === 'string' && phoneme.Phoneme.length > 0
          ? phoneme.Phoneme
          : '',
      expectedPhoneme:
        typeof phoneme?.Phoneme === 'string' && phoneme.Phoneme.length > 0
          ? phoneme.Phoneme
          : '',
      score: this.clampScore(
        Number(phoneme?.PronunciationAssessment?.AccuracyScore ?? 0),
      ),
      startMs: this.convertAzureTimeToMs(phoneme?.Offset),
      endMs: this.convertAzureTimeToMs(
        typeof phoneme?.Offset === 'number' && typeof phoneme?.Duration === 'number'
          ? phoneme.Offset + phoneme.Duration
          : undefined,
      ),
    }));
  }

  private convertAzureTimeToMs(value: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      return undefined;
    }

    return Math.round(value / 10000);
  }

  private decodeAudioBase64(audioBase64: string): Buffer | null {
    const trimmed = audioBase64.trim();
    const normalized = trimmed.includes(',') ? trimmed.split(',').pop() || '' : trimmed;

    if (!normalized) {
      return null;
    }

    try {
      return Buffer.from(normalized, 'base64');
    } catch {
      return null;
    }
  }

  private mapAzureWordErrorType(value: unknown): PronunciationWordErrorType {
    switch (value) {
      case 'None':
        return PronunciationWordErrorType.NONE;
      case 'Mispronunciation':
        return PronunciationWordErrorType.MISPRONUNCIATION;
      case 'Omission':
        return PronunciationWordErrorType.OMISSION;
      case 'Insertion':
        return PronunciationWordErrorType.INSERTION;
      case 'UnexpectedBreak':
        return PronunciationWordErrorType.UNEXPECTED_BREAK;
      case 'MissingBreak':
        return PronunciationWordErrorType.MISSING_BREAK;
      default:
        return PronunciationWordErrorType.UNKNOWN;
    }
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
