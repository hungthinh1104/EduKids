import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, Min, Max, IsNumber } from 'class-validator';
import { PronunciationAssessmentResultDto } from './pronunciation-assessment.dto';

export class PronunciationSubmitDto {
  @ApiProperty({
    example: 1,
    description: 'Vocabulary ID to practice pronunciation',
  })
  @IsInt()
  vocabularyId: number;

  @ApiProperty({
    example: 85,
    description: 'Confidence score from Web Speech API (0-100)',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  confidenceScore: number;

  @ApiProperty({
    example: 2500,
    description: 'Duration of recording in milliseconds (5000-10000ms = 5-10s)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(5000)
  @Max(10000)
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
