import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsInt, IsArray } from "class-validator";

export class VocabularyMediaDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "IMAGE", enum: ["IMAGE", "AUDIO", "VIDEO"] })
  type: string;

  @ApiProperty({
    example: "https://res.cloudinary.com/edukids/image/dog.jpg",
    description: "CDN URL for media",
  })
  url: string;
}

export class VocabularyDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  topicId: number;

  @ApiProperty({ example: "dog", description: "English word" })
  @IsString()
  word: string;

  @ApiProperty({ example: "/dɒɡ/", required: false })
  @IsOptional()
  @IsString()
  phonetic?: string;

  @ApiProperty({
    example: "chó",
    description: "Vietnamese translation",
    required: false,
  })
  @IsOptional()
  @IsString()
  translation?: string;

  @ApiProperty({ example: "noun", required: false })
  @IsOptional()
  @IsString()
  partOfSpeech?: string;

  @ApiProperty({ example: "I have a dog.", required: false })
  @IsOptional()
  @IsString()
  exampleSentence?: string;

  @ApiProperty({
    example: 1,
    description: "Difficulty level 1-3",
    required: false,
  })
  @IsOptional()
  @IsInt()
  difficulty?: number;

  @ApiProperty({
    type: [VocabularyMediaDto],
    description: "Associated media files",
  })
  @IsArray()
  media: VocabularyMediaDto[];

  @ApiProperty({ example: "2024-01-01T00:00:00.000Z" })
  createdAt: Date;
}
