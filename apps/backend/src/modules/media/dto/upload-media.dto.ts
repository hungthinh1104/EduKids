import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export enum MediaType {
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
}

export enum MediaContext {
  VOCABULARY = 'VOCABULARY',
  TOPIC = 'TOPIC',
  QUIZ = 'QUIZ',
  PROFILE = 'PROFILE',
  GENERAL = 'GENERAL',
}

export class UploadMediaDto {
  @ApiProperty({
    description: 'Type of media being uploaded',
    enum: MediaType,
    example: MediaType.IMAGE,
  })
  @IsEnum(MediaType)
  @IsNotEmpty()
  mediaType: MediaType;

  @ApiProperty({
    description: 'Context where media will be used',
    enum: MediaContext,
    example: MediaContext.VOCABULARY,
  })
  @IsEnum(MediaContext)
  @IsNotEmpty()
  context: MediaContext;

  @ApiProperty({
    description: 'Optional description of the media',
    example: 'Illustration for vocabulary word "apple"',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Optional alt text for accessibility',
    example: 'Red apple on white background',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  altText?: string;
}
