import { Injectable, Logger } from '@nestjs/common';
import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';
import {
  PhonemeAssessmentDto,
  PronunciationAssessmentMode,
  PronunciationAssessmentProvider,
  PronunciationAssessmentResultDto,
  PronunciationWordErrorType,
  SyllableAssessmentDto,
  WordAssessmentDto,
} from '../dto/pronunciation-assessment.dto';
import type { BuildAssessmentInput } from '../pronunciation-assessment.service';
import type { PronunciationProvider } from './pronunciation-provider.interface';

type RawWordResult = Record<string, any>;

@Injectable()
export class AzureSpeechPronunciationProvider implements PronunciationProvider {
  readonly name = PronunciationAssessmentProvider.AZURE_SPEECH;
  private readonly logger = new Logger(AzureSpeechPronunciationProvider.name);

  async assess(
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

    const audioBuffer = this.validateAndDecodeAudio(input.audioBase64, input.audioMimeType);
    if (!audioBuffer) {
      this.logger.warn(
        'Azure Speech assessment requires a valid WAV payload. Falling back to CUSTOM.',
      );
      return null;
    }

    const speechConfig = speechsdk.SpeechConfig.fromSubscription(subscriptionKey, region);
    const language = process.env.AZURE_SPEECH_LANGUAGE || 'en-US';
    speechConfig.speechRecognitionLanguage = language;
    speechConfig.outputFormat = speechsdk.OutputFormat.Detailed;

    const audioConfig = speechsdk.AudioConfig.fromWavFileInput(audioBuffer);
    const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

    try {
      const referenceText = input.referenceText.trim();
      const pronunciationConfig = new speechsdk.PronunciationAssessmentConfig(
        referenceText,
        speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
        speechsdk.PronunciationAssessmentGranularity.Phoneme,
        true,
      );

      if (language.toLowerCase() === 'en-us') {
        (pronunciationConfig as typeof pronunciationConfig & { enableProsodyAssessment?: boolean })
          .enableProsodyAssessment = true;
      }

      pronunciationConfig.applyTo(recognizer);

      if (input.mode === PronunciationAssessmentMode.PARAGRAPH) {
        return await this.buildAzureContinuousAssessment(recognizer, input);
      }

      return await this.buildAzureSingleAssessment(recognizer, input);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Azure Speech error';
      this.logger.warn(
        `Azure Speech pronunciation assessment failed. Falling back to CUSTOM. ${message}`,
      );
      return null;
    } finally {
      recognizer.close();
    }
  }

  private async buildAzureSingleAssessment(
    recognizer: speechsdk.SpeechRecognizer,
    input: BuildAssessmentInput,
  ): Promise<PronunciationAssessmentResultDto> {
    const AZURE_TIMEOUT_MS = 8_000;
    const result = await Promise.race([
      new Promise<speechsdk.SpeechRecognitionResult>((resolve, reject) => {
        recognizer.recognizeOnceAsync(resolve, reject);
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Azure Speech timed out after ${AZURE_TIMEOUT_MS}ms`)),
          AZURE_TIMEOUT_MS,
        ),
      ),
    ]);

    const parsed = this.parseJsonResult(
      result.properties.getProperty(
        speechsdk.PropertyId.SpeechServiceResponse_JsonResult,
      ),
    );
    const bestResult = this.getBestResult(parsed);
    const assessment =
      bestResult?.PronunciationAssessment ?? parsed?.PronunciationAssessment ?? {};
    const wordResults = Array.isArray(bestResult?.Words) ? bestResult.Words : [];
    const recognizedText = this.extractRecognizedText(parsed, bestResult, input);
    const fallbackScore =
      typeof input.confidenceScore === 'number'
        ? input.confidenceScore
        : this.estimateScoreFromText(input.referenceText, recognizedText);

    const accuracyScore = this.clampScore(
      Number(assessment.AccuracyScore ?? fallbackScore),
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
      Number(assessment.PronScore ?? assessment.PronunciationScore ?? accuracyScore),
    );

    return {
      mode: PronunciationAssessmentMode.WORD,
      provider: PronunciationAssessmentProvider.AZURE_SPEECH,
      overallScore,
      accuracyScore,
      fluencyScore,
      completenessScore,
      prosodyScore,
      recognizedText,
      recognizedIpa: input.recognizedIpa,
      referenceText: input.referenceText,
      words: this.mapAzureWords(wordResults, input),
      passed: overallScore >= 80,
    };
  }

  private async buildAzureContinuousAssessment(
    recognizer: speechsdk.SpeechRecognizer,
    input: BuildAssessmentInput,
  ): Promise<PronunciationAssessmentResultDto> {
    const collectedResults = await this.collectContinuousResults(recognizer);

    const rawWords: RawWordResult[] = [];
    const recognizedTexts: string[] = [];
    const fluencyScores: number[] = [];
    const prosodyScores: number[] = [];
    const durations: number[] = [];

    for (const parsed of collectedResults) {
      const bestResult = this.getBestResult(parsed);
      const phraseAssessment = bestResult?.PronunciationAssessment ?? {};
      const words = Array.isArray(bestResult?.Words) ? bestResult.Words : [];
      const recognizedText = this.extractRecognizedText(parsed, bestResult, input);

      if (recognizedText.trim().length > 0) {
        recognizedTexts.push(recognizedText);
      }

      if (typeof phraseAssessment.FluencyScore === 'number') {
        fluencyScores.push(phraseAssessment.FluencyScore);
      }

      if (typeof phraseAssessment.ProsodyScore === 'number') {
        prosodyScores.push(phraseAssessment.ProsodyScore);
      }

      if (words.length > 0) {
        rawWords.push(...words);
        const phraseDuration = words.reduce((sum, word) => {
          const duration = typeof word?.Duration === 'number' ? word.Duration : 0;
          return sum + duration;
        }, 0);
        durations.push(phraseDuration);
      }
    }

    const alignedWords = this.alignWordsWithReference(input.referenceText, rawWords);
    const recognizedText = recognizedTexts.join(' ').trim();
    const accuracyScore = this.calculateAccuracyScore(alignedWords);
    const completenessScore = this.calculateCompletenessScore(
      input.referenceText,
      alignedWords,
    );
    const fluencyScore = this.calculateWeightedFluencyScore(fluencyScores, durations);
    const prosodyScore =
      prosodyScores.length > 0
        ? this.clampScore(
            prosodyScores.reduce((sum, value) => sum + value, 0) / prosodyScores.length,
          )
        : undefined;
    const overallScore = this.calculateOverallScore({
      accuracyScore,
      fluencyScore,
      completenessScore,
      prosodyScore,
    });

    return {
      mode: PronunciationAssessmentMode.PARAGRAPH,
      provider: PronunciationAssessmentProvider.AZURE_SPEECH,
      overallScore,
      accuracyScore,
      fluencyScore,
      completenessScore,
      prosodyScore,
      recognizedText,
      recognizedIpa: input.recognizedIpa,
      referenceText: input.referenceText,
      words: alignedWords,
      passed: overallScore >= 80,
    };
  }

  private async collectContinuousResults(
    recognizer: speechsdk.SpeechRecognizer,
  ): Promise<Record<string, any>[]> {
    const AZURE_TIMEOUT_MS = 20_000;

    return await Promise.race([
      new Promise<Record<string, any>[]>((resolve, reject) => {
        const collected: Record<string, any>[] = [];
        let settled = false;

        const finish = (callback: () => void) => {
          if (settled) return;
          settled = true;
          callback();
        };

        recognizer.recognized = (_sender, event) => {
          const rawJson = event.result.properties.getProperty(
            speechsdk.PropertyId.SpeechServiceResponse_JsonResult,
          );
          const parsed = this.parseJsonResult(rawJson);
          if (parsed) {
            collected.push(parsed);
          }
        };

        recognizer.canceled = (_sender, event) => {
          if (event.reason === speechsdk.CancellationReason.Error) {
            finish(() => reject(new Error(event.errorDetails || 'Azure Speech canceled')));
            return;
          }

          finish(() => resolve(collected));
        };

        recognizer.sessionStopped = () => {
          finish(() => resolve(collected));
        };

        recognizer.startContinuousRecognitionAsync(
          () => undefined,
          (error) => finish(() => reject(new Error(String(error)))),
        );
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Azure Speech timed out after ${AZURE_TIMEOUT_MS}ms`)),
          AZURE_TIMEOUT_MS,
        ),
      ),
    ]).finally(() => {
      recognizer.stopContinuousRecognitionAsync(
        () => undefined,
        () => undefined,
      );
    });
  }

  private alignWordsWithReference(
    referenceText: string,
    rawWords: RawWordResult[],
  ): WordAssessmentDto[] {
    const referenceWords = this.normalizeTextToWords(referenceText);
    const spokenWords = rawWords.map((word) => this.normalizeToken(word?.Word));
    const alignment = this.computeTokenAlignment(referenceWords, spokenWords);

    const mappedWords: WordAssessmentDto[] = [];
    let referenceIndex = 0;
    let spokenIndex = 0;

    for (const step of alignment) {
      if (step === 'equal') {
        mappedWords.push(
          this.mapAlignedWord(rawWords[spokenIndex], referenceWords[referenceIndex], PronunciationWordErrorType.NONE),
        );
        referenceIndex += 1;
        spokenIndex += 1;
        continue;
      }

      if (step === 'replace') {
        mappedWords.push(
          this.mapAlignedWord(
            rawWords[spokenIndex],
            referenceWords[referenceIndex],
            PronunciationWordErrorType.MISPRONUNCIATION,
          ),
        );
        referenceIndex += 1;
        spokenIndex += 1;
        continue;
      }

      if (step === 'delete') {
        mappedWords.push({
          word: referenceWords[referenceIndex],
          targetIpa: '',
          spokenIpa: '',
          score: 0,
          errorType: PronunciationWordErrorType.OMISSION,
          isMatch: false,
        });
        referenceIndex += 1;
        continue;
      }

      mappedWords.push(
        this.mapAlignedWord(
          rawWords[spokenIndex],
          undefined,
          PronunciationWordErrorType.INSERTION,
        ),
      );
      spokenIndex += 1;
    }

    return mappedWords;
  }

  private mapAlignedWord(
    rawWord: RawWordResult | undefined,
    referenceWord: string | undefined,
    errorType: PronunciationWordErrorType,
  ): WordAssessmentDto {
    const accuracyScore = this.clampScore(
      Number(rawWord?.PronunciationAssessment?.AccuracyScore ?? 0),
    );

    return {
      word:
        typeof rawWord?.Word === 'string' && rawWord.Word.length > 0
          ? rawWord.Word
          : referenceWord || '',
      targetIpa: '',
      spokenIpa: '',
      score: errorType === PronunciationWordErrorType.OMISSION ? 0 : accuracyScore,
      errorType,
      startMs: this.convertAzureTimeToMs(rawWord?.Offset),
      endMs: this.convertAzureTimeToMs(
        typeof rawWord?.Offset === 'number' && typeof rawWord?.Duration === 'number'
          ? rawWord.Offset + rawWord.Duration
          : undefined,
      ),
      isMatch: errorType === PronunciationWordErrorType.NONE,
      syllables: this.mapAzureSyllables(rawWord?.Syllables),
      phonemes: this.mapAzurePhonemes(rawWord?.Phonemes),
    };
  }

  private computeTokenAlignment(
    referenceWords: string[],
    spokenWords: string[],
  ): Array<'equal' | 'replace' | 'delete' | 'insert'> {
    const rows = referenceWords.length;
    const cols = spokenWords.length;
    const dp = Array.from({ length: rows + 1 }, () => Array(cols + 1).fill(0));

    for (let i = 0; i <= rows; i += 1) dp[i][0] = i;
    for (let j = 0; j <= cols; j += 1) dp[0][j] = j;

    for (let i = 1; i <= rows; i += 1) {
      for (let j = 1; j <= cols; j += 1) {
        if (referenceWords[i - 1] === spokenWords[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
          continue;
        }

        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1,
        );
      }
    }

    const actions: Array<'equal' | 'replace' | 'delete' | 'insert'> = [];
    let i = rows;
    let j = cols;

    while (i > 0 || j > 0) {
      if (
        i > 0 &&
        j > 0 &&
        referenceWords[i - 1] === spokenWords[j - 1] &&
        dp[i][j] === dp[i - 1][j - 1]
      ) {
        actions.push('equal');
        i -= 1;
        j -= 1;
        continue;
      }

      if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
        actions.push('replace');
        i -= 1;
        j -= 1;
        continue;
      }

      if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
        actions.push('delete');
        i -= 1;
        continue;
      }

      actions.push('insert');
      j -= 1;
    }

    return actions.reverse();
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
          score: this.clampScore(
            typeof input.confidenceScore === 'number'
              ? input.confidenceScore
              : this.estimateScoreFromText(input.referenceText, input.recognizedText),
          ),
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
        Number(wordResult?.PronunciationAssessment?.AccuracyScore ?? 0),
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

  private parseJsonResult(rawJson: string | undefined): Record<string, any> | null {
    if (!rawJson) return null;

    try {
      return JSON.parse(rawJson) as Record<string, any>;
    } catch {
      return null;
    }
  }

  private getBestResult(parsed: Record<string, any> | null): Record<string, any> | null {
    return Array.isArray(parsed?.NBest) ? parsed.NBest[0] : null;
  }

  private extractRecognizedText(
    parsed: Record<string, any> | null,
    bestResult: Record<string, any> | null,
    input: BuildAssessmentInput,
  ): string {
    if (typeof bestResult?.Lexical === 'string' && bestResult.Lexical.trim().length > 0) {
      return bestResult.Lexical;
    }

    if (typeof parsed?.DisplayText === 'string' && parsed.DisplayText.trim().length > 0) {
      return parsed.DisplayText;
    }

    return input.recognizedText || input.referenceText;
  }

  private calculateAccuracyScore(words: WordAssessmentDto[]): number {
    const eligibleScores = words
      .filter((word) => word.errorType !== PronunciationWordErrorType.INSERTION)
      .map((word) =>
        word.errorType === PronunciationWordErrorType.OMISSION ? 0 : word.score,
      );

    if (eligibleScores.length === 0) return 0;
    return this.clampScore(
      eligibleScores.reduce((sum, value) => sum + value, 0) / eligibleScores.length,
    );
  }

  private calculateCompletenessScore(
    referenceText: string,
    words: WordAssessmentDto[],
  ): number {
    const referenceCount = this.normalizeTextToWords(referenceText).length;
    if (referenceCount === 0) return 0;

    const matched = words.filter(
      (word) => word.errorType === PronunciationWordErrorType.NONE,
    ).length;

    return this.clampScore((matched / referenceCount) * 100);
  }

  private calculateWeightedFluencyScore(scores: number[], durations: number[]): number {
    if (scores.length === 0 || durations.length === 0) return 0;

    const weightedSum = scores.reduce((sum, score, index) => {
      return sum + score * (durations[index] || 0);
    }, 0);
    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);

    if (totalDuration <= 0) {
      return this.clampScore(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    }

    return this.clampScore(weightedSum / totalDuration);
  }

  private calculateOverallScore(input: {
    accuracyScore: number;
    fluencyScore: number;
    completenessScore?: number;
    prosodyScore?: number;
  }): number {
    const scoreEntries = [
      input.accuracyScore,
      input.fluencyScore,
      input.completenessScore ?? 0,
      input.prosodyScore ?? 0,
    ].sort((left, right) => left - right);

    if (input.prosodyScore === undefined) {
      return this.clampScore(input.accuracyScore * 0.5 + input.fluencyScore * 0.5);
    }

    return this.clampScore(
      scoreEntries[0] * 0.4 +
        scoreEntries[1] * 0.2 +
        scoreEntries[2] * 0.2 +
        scoreEntries[3] * 0.2,
    );
  }

  private estimateScoreFromText(referenceText: string, recognizedText?: string): number {
    const referenceWords = this.normalizeTextToWords(referenceText);
    const spokenWords = this.normalizeTextToWords(recognizedText || '');

    if (referenceWords.length === 0) return 0;
    if (spokenWords.length === 0) return 25;

    const matches = referenceWords.filter((word, index) => spokenWords[index] === word).length;
    return this.clampScore((matches / referenceWords.length) * 100);
  }

  private normalizeTextToWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[!"#$%&()*+,./:;<=>?@[\\\]^_`{|}~-]+/g, ' ')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);
  }

  private normalizeToken(token: unknown): string {
    if (typeof token !== 'string') return '';
    return token.toLowerCase().replace(/[!"#$%&()*+,./:;<=>?@[\\\]^_`{|}~-]+/g, '').trim();
  }

  private convertAzureTimeToMs(value: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      return undefined;
    }

    return Math.round(value / 10000);
  }

  private validateAndDecodeAudio(
    audioBase64?: string,
    audioMimeType?: string,
  ): Buffer | null {
    if (!audioBase64) {
      return null;
    }

    if (
      audioMimeType &&
      !['audio/wav', 'audio/x-wav', 'audio/wave'].includes(audioMimeType.toLowerCase())
    ) {
      return null;
    }

    const trimmed = audioBase64.trim();
    const normalized = trimmed.includes(',') ? trimmed.split(',').pop() || '' : trimmed;
    if (!normalized) {
      return null;
    }

    try {
      const audioBuffer = Buffer.from(normalized, 'base64');
      const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
      if (audioBuffer.length === 0 || audioBuffer.length > MAX_AUDIO_BYTES) {
        return null;
      }

      if (
        audioBuffer.length < 12 ||
        audioBuffer.subarray(0, 4).toString('ascii') !== 'RIFF' ||
        audioBuffer.subarray(8, 12).toString('ascii') !== 'WAVE'
      ) {
        return null;
      }

      return audioBuffer;
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

  private clampScore(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
}
