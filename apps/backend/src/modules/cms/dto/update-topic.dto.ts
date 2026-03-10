import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { ContentStatus } from "./create-topic.dto";

export class UpdateTopicDto {
  @ApiProperty({
    example: "Animals (Updated)",
    description: "Topic name",
    minLength: 2,
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiProperty({
    example: "Learn about different animals and their habitats",
    description: "Topic description",
    minLength: 10,
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    example: 2,
    description: "Learning level (1-5)",
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  learningLevel?: number;

  @ApiProperty({
    example: "https://cdn.example.com/animals-v2.jpg",
    description: "Topic image CDN URL",
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    example: "REVIEW",
    description: "Content status",
    enum: ContentStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiProperty({
    example: ["education", "vocabulary", "intermediate"],
    description: "Topic tags",
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
