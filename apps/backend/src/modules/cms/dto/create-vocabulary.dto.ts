import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsNumber,
} from "class-validator";
import { ContentStatus } from "./create-topic.dto";

export class CreateVocabularyDto {
  @ApiProperty({
    example: 1,
    description: "Topic ID that this vocabulary belongs to",
  })
  @IsNumber()
  @IsNotEmpty()
  topicId: number;

  @ApiProperty({
    example: "Lion",
    description: "Vocabulary word",
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  word: string;

  @ApiProperty({
    example: "A large carnivorous feline",
    description: "Word definition",
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  definition: string;

  @ApiProperty({
    example: "/laɪən/",
    description: "Phonetic transcription",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  phonetic?: string;

  @ApiProperty({
    example: "A large wild cat with a mane",
    description: "Word example usage",
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
    example: "https://cdn.example.com/lion.jpg",
    description: "Vocabulary image URL",
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    example: "https://cdn.example.com/lion.mp3",
    description: "Audio URL for pronunciation",
    required: false,
  })
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiProperty({
    example: "DRAFT",
    description: "Content status",
    enum: ContentStatus,
    default: ContentStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus = ContentStatus.DRAFT;
}
