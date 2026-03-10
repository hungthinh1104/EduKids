import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PronunciationAssessmentProvider {
  AZURE_SPEECH = 'AZURE_SPEECH',
  GOOGLE_SPEECH = 'GOOGLE_SPEECH',
  CUSTOM = 'CUSTOM',
}

export class PhonemeAssessmentDto {
  @ApiProperty({ example: '/d/' })
  @IsString()
  phoneme: string;

  @ApiProperty({ example: '/t/' })
  @IsString()
  expectedPhoneme: string;

  @ApiProperty({ example: 82, description: 'Phoneme score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @ApiPropertyOptional({ example: 120, description: 'Start time in ms' })
  @IsOptional()
  @IsNumber()
  startMs?: number;

  @ApiPropertyOptional({ example: 160, description: 'End time in ms' })
  @IsOptional()
  @IsNumber()
  endMs?: number;
}

export class WordAssessmentDto {
  @ApiProperty({ example: 'dog' })
  @IsString()
  word: string;

  @ApiProperty({ example: '/dɔːɡ/' })
  @IsString()
  targetIpa: string;

  @ApiProperty({ example: '/dɑg/' })
  @IsString()
  spokenIpa: string;

  @ApiProperty({ example: 87, description: 'Word-level score (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @ApiPropertyOptional({ type: [PhonemeAssessmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhonemeAssessmentDto)
  phonemes?: PhonemeAssessmentDto[];
}

export class PronunciationAssessmentResultDto {
  @ApiProperty({ enum: PronunciationAssessmentProvider })
  @IsEnum(PronunciationAssessmentProvider)
  provider: PronunciationAssessmentProvider;

  @ApiProperty({ example: 88 })
  @IsNumber()
  @Min(0)
  @Max(100)
  overallScore: number;

  @ApiProperty({ example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  accuracyScore: number;

  @ApiProperty({ example: 81 })
  @IsNumber()
  @Min(0)
  @Max(100)
  fluencyScore: number;

  @ApiPropertyOptional({ example: 79 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  completenessScore?: number;

  @ApiPropertyOptional({ example: 76 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  prosodyScore?: number;

  @ApiPropertyOptional({ example: 'dog' })
  @IsOptional()
  @IsString()
  recognizedText?: string;

  @ApiPropertyOptional({ example: '/dɔːɡ/' })
  @IsOptional()
  @IsString()
  recognizedIpa?: string;

  @ApiPropertyOptional({ type: [WordAssessmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WordAssessmentDto)
  words?: WordAssessmentDto[];

  @ApiPropertyOptional({ example: true, description: 'Whether this attempt passes configured threshold' })
  @IsOptional()
  @IsBoolean()
  passed?: boolean;
}
