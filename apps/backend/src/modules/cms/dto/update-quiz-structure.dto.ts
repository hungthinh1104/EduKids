import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  IsUrl,
} from "class-validator";
import { Type } from "class-transformer";
import { ContentStatus } from "./create-topic.dto";
import { QuizQuestionOptionDto } from "./create-quiz-structure.dto";

export class UpdateQuizStructureDto {
  @ApiProperty({
    example: "Animal Quiz 1 (Updated)",
    description: "Quiz title",
    minLength: 3,
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title?: string;

  @ApiProperty({
    example: "Test your knowledge about animals and wildlife",
    description: "Quiz description",
    minLength: 5,
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    example: "What is the largest marine animal?",
    description: "Quiz question text",
    minLength: 5,
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  questionText?: string;

  @ApiProperty({
    example:
      "https://res.cloudinary.com/edukids/image/upload/v1/quiz/question-cat.jpg",
    description: "Optional image URL displayed with the quiz question",
    required: false,
  })
  @IsOptional()
  @IsUrl({
    protocols: ["http", "https"],
    require_protocol: true,
  })
  questionImageUrl?: string;

  @ApiProperty({
    example: [
      { text: "Shark", isCorrect: false },
      { text: "Blue Whale", isCorrect: true },
      { text: "Octopus", isCorrect: false },
    ],
    description: "Quiz question options",
    type: [QuizQuestionOptionDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionOptionDto)
  options?: QuizQuestionOptionDto[];

  @ApiProperty({
    example: 4,
    description: "Difficulty level (1-5)",
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  difficultyLevel?: number;

  @ApiProperty({
    example: "PUBLISHED",
    description: "Content status",
    enum: ContentStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}
