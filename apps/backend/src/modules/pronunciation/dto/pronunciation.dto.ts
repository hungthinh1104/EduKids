import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  IsNumber,
} from 'class-validator';
import {
  PronunciationAssessmentMode,
  PronunciationAssessmentResultDto,
} from './pronunciation-assessment.dto';

export class PronunciationSubmitDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Vocabulary ID to practice pronunciation. Path param is the source of truth.',
    required: false,
  })
  @IsOptional()
  @IsInt()
  vocabularyId?: number;

  @ApiPropertyOptional({
    example: 85,
    description: 'Optional legacy confidence score from client-side evaluation. Backend/provider score is authoritative.',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  confidenceScore?: number;

  @ApiPropertyOptional({
    enum: PronunciationAssessmentMode,
    description: 'Assessment mode. WORD is optimized for single-word practice; PARAGRAPH uses reference text and continuous recognition.',
    default: PronunciationAssessmentMode.WORD,
  })
  @IsOptional()
  @IsEnum(PronunciationAssessmentMode)
  mode?: PronunciationAssessmentMode;

  @ApiPropertyOptional({
    example: 'Today was a beautiful day.',
    description: 'Reference text for Azure pronunciation assessment. Defaults to the vocabulary word in WORD mode.',
  })
  @IsOptional()
  @IsString()
  referenceText?: string;

  @ApiProperty({
    example: 2500,
    description: 'Duration of recording in milliseconds',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(120000)
  recordingDurationMs?: number;

  @ApiProperty({
    example: 'Good pronunciation with clear enunciation',
    description: 'Additional notes from browser evaluation',
    required: false,
  })
  @IsOptional()
  @IsString()
  evaluationNotes?: string;

  @ApiProperty({
    example: 'dog',
    description: 'Recognized text from client-side speech engine',
    required: false,
  })
  @IsOptional()
  @IsString()
  recognizedText?: string;

  @ApiProperty({
    example: '/dɑg/',
    description: 'Recognized IPA transcription if available from client/provider',
    required: false,
  })
  @IsOptional()
  @IsString()
  recognizedIpa?: string;

  @ApiPropertyOptional({
    example: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=',
    description:
      'Optional Base64-encoded WAV audio or WAV data URL for provider-side pronunciation assessment',
  })
  @IsOptional()
  @IsString()
  audioBase64?: string;

  @ApiPropertyOptional({
    example: 'audio/wav',
    description: 'Optional MIME type for the provided audio payload',
  })
  @IsOptional()
  @IsString()
  audioMimeType?: string;
}

export class StarRatingDto {
  @ApiProperty({ example: 4, description: 'Star rating 1-5' })
  stars: number;

  @ApiProperty({ example: '⭐⭐⭐⭐✨', description: 'Star emoji representation' })
  starEmoji: string;

  @ApiProperty({
    example: 'Excellent pronunciation!',
    description: 'Kid-friendly feedback message',
  })
  feedbackMessage: string;

  @ApiProperty({
    example: '+15 Star Points!',
    description: 'Reward earned',
    required: false,
  })
  rewardMessage?: string;
}

export class PronunciationFeedbackDto {
  @ApiProperty({ example: 1 })
  attemptId: number;

  @ApiProperty({ example: 1 })
  vocabularyId: number;

  @ApiProperty({ example: 'dog' })
  word: string;

  @ApiProperty({ example: 85 })
  confidenceScore: number;

  @ApiProperty({ enum: PronunciationAssessmentMode })
  mode: PronunciationAssessmentMode;

  @ApiProperty({
    type: StarRatingDto,
    description: 'Star rating and kid-friendly feedback',
  })
  rating: StarRatingDto;

  @ApiProperty({
    example: 'https://res.cloudinary.com/edukids/audio/dog.mp3',
    description: 'Native pronunciation audio to listen to',
  })
  nativePronunciationAudio: string;

  @ApiProperty({
    example: 'Your pronunciation is very clear! 🎉',
    description: 'Detailed constructive feedback',
    required: false,
  })
  detailedFeedback?: string;

  @ApiProperty({ example: 320, description: 'Total star points after this practice' })
  totalPoints: number;

  @ApiProperty({ example: 6, description: 'Current level' })
  currentLevel: number;

  @ApiProperty({
    example: 'Bronze Badge: First 50 Perfect Pronunciations',
    description: 'Badge earned if any',
    required: false,
  })
  badgeUnlocked?: string;

  @ApiProperty({ example: '2024-03-05T10:30:00Z' })
  attemptedAt: Date;

  @ApiProperty({
    type: PronunciationAssessmentResultDto,
    description: 'Detailed pronunciation assessment for IPA/phoneme/word scoring',
    required: false,
  })
  @IsOptional()
  assessment?: PronunciationAssessmentResultDto;
}

export class PronunciationProgressDto {
  @ApiProperty({ example: 1 })
  vocabularyId: number;

  @ApiProperty({ example: 'dog' })
  word: string;

  @ApiProperty({ example: 85, description: 'Best score for this vocabulary' })
  bestScore: number;

  @ApiProperty({ example: 4, description: 'Best star rating achieved' })
  bestRating: number;

  @ApiProperty({ example: 5, description: 'Total attempts' })
  attemptCount: number;

  @ApiProperty({
    example: 3,
    description: 'Consecutive perfect attempts (score >= 80)',
  })
  perfectStreak: number;

  @ApiProperty({ example: '2024-03-05T10:30:00Z' })
  lastAttemptedAt: Date;
}
