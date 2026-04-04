import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
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

export class QuizQuestionOptionDto {
  @ApiProperty({
    example: "Lion",
    description: "Option text",
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  text: string;

  @ApiProperty({
    example: true,
    description: "Is this the correct option",
  })
  @IsNotEmpty()
  isCorrect: boolean;
}

export class CreateQuizStructureDto {
  @ApiProperty({
    example: 1,
    description: "Topic ID that this quiz belongs to",
  })
  @IsNumber()
  @IsNotEmpty()
  topicId: number;

  @ApiProperty({
    example: "Animal Quiz 1",
    description: "Quiz title",
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @ApiProperty({
    example: "Test your knowledge about animals",
    description: "Quiz description",
    minLength: 5,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  description: string;

  @ApiProperty({
    example: "What is the largest land animal?",
    description: "Quiz question text",
    minLength: 5,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  questionText: string;

  @ApiProperty({
    example: "https://res.cloudinary.com/edukids/image/upload/v1/quiz/question-cat.jpg",
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
      { text: "Lion", isCorrect: false },
      { text: "Elephant", isCorrect: true },
      { text: "Giraffe", isCorrect: false },
      { text: "Rhino", isCorrect: false },
    ],
    description: "Quiz question options (at least 2, max 1 correct)",
    type: [QuizQuestionOptionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionOptionDto)
  @IsNotEmpty()
  options: QuizQuestionOptionDto[];

  @ApiProperty({
    example: 3,
    description: "Difficulty level (1-5)",
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @IsNotEmpty()
  difficultyLevel: number;

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
