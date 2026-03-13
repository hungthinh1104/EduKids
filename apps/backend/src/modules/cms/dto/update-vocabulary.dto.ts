import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from "class-validator";
import { ContentStatus } from "./create-topic.dto";

export class UpdateVocabularyDto {
  @ApiProperty({
    example: "Tiger",
    description: "Vocabulary word",
    minLength: 1,
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  word?: string;

  @ApiProperty({
    example: "A large striped carnivorous feline",
    description: "Word definition (stored as translation)",
    minLength: 1,
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  definition?: string;

  @ApiProperty({
    example: "/taɪɡər/",
    description: "Phonetic transcription",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  phonetic?: string;

  @ApiProperty({
    example: "A fierce wild cat with orange and black stripes",
    description: "Word example usage (stored as exampleSentence)",
    minLength: 1,
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  example?: string;

  @ApiProperty({
    example: "https://cdn.example.com/tiger.jpg",
    description: "Vocabulary image URL",
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    example: "https://cdn.example.com/tiger.mp3",
    description: "Audio URL for pronunciation",
    required: false,
  })
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiProperty({
    example: "REVIEW",
    description: "Content status",
    enum: ContentStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}
