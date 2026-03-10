import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  Min,
  Max,
} from "class-validator";

export enum ContentStatus {
  DRAFT = "DRAFT",
  REVIEW = "REVIEW",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export class CreateTopicDto {
  @ApiProperty({
    example: "Animals",
    description: "Topic name",
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    example: "Learn about different animals",
    description: "Topic description",
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  description: string;

  @ApiProperty({
    example: 1,
    description: "Learning level (1-5)",
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  learningLevel: number;

  @ApiProperty({
    example: "https://cdn.example.com/animals.jpg",
    description: "Topic image CDN URL",
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    example: "DRAFT",
    description: "Content status",
    enum: ContentStatus,
    default: ContentStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus = ContentStatus.DRAFT;

  @ApiProperty({
    example: ["education", "vocabulary", "beginner"],
    description: "Topic tags",
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
