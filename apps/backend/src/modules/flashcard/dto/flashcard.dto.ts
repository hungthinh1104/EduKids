import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, IsOptional, IsEnum, Min } from "class-validator";

export enum ActivityType {
  DRAG_DROP = "DRAG_DROP",
  MATCHING = "MATCHING",
  FILL_BLANK = "FILL_BLANK",
}

export class FlashcardMediaDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "IMAGE", enum: ["IMAGE", "AUDIO", "VIDEO"] })
  type: string;

  @ApiProperty({ example: "https://res.cloudinary.com/edukids/image/dog.jpg" })
  url: string;
}

export class FlashcardDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  vocabularyId: number;

  @ApiProperty({ example: "dog" })
  word: string;

  @ApiProperty({ example: "/dɒɡ/", required: false })
  phonetic?: string;

  @ApiProperty({
    example: "The dog is running in the yard.",
    description: "Example sentence for the vocabulary",
    required: false,
  })
  exampleSentence?: string;

  @ApiProperty({
    example: "chó",
    description: "Vietnamese translation",
    required: false,
  })
  translation?: string;

  @ApiProperty({
    type: [FlashcardMediaDto],
    description: "Image, audio, video files",
  })
  media: FlashcardMediaDto[];

  @ApiProperty({ example: "https://res.cloudinary.com/edukids/audio/dog.mp3" })
  audioUrl: string;

  @ApiProperty({
    example: "https://res.cloudinary.com/edukids/image/dog.jpg",
    description: "Main display image",
  })
  imageUrl: string;

  @ApiProperty({ example: 1, description: "Difficulty level 1-3" })
  difficulty?: number;
}

export class DragDropOptionDto {
  @ApiProperty({ example: 1, description: "Option ID" })
  @IsInt()
  id: number;

  @ApiProperty({ example: "chó", description: "Option text" })
  @IsString()
  text: string;

  @ApiProperty({
    example: true,
    description: "Whether this is the correct answer",
  })
  isCorrect?: boolean; // Should not be sent by client, populated by server
}

export class DragDropActivityDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  vocabularyId: number;

  @ApiProperty({ example: 1, description: "Selected option ID" })
  @IsInt()
  selectedOptionId: number;

  @ApiProperty({
    example: 200,
    description: "Time taken in milliseconds",
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeTakenMs?: number;

  @ApiProperty({ example: "DRAG_DROP", enum: ActivityType })
  @IsEnum(ActivityType)
  activityType: ActivityType;
}

export class FeedbackDto {
  @ApiProperty({ example: true })
  isCorrect: boolean;

  @ApiProperty({ example: "Correct! Well done." })
  message: string;

  @ApiProperty({
    example: 10,
    description: "Star points earned",
    required: false,
  })
  pointsEarned?: number;

  @ApiProperty({
    example: "chó",
    description: "Correct answer if user was wrong",
    required: false,
  })
  correctAnswer?: string;

  @ApiProperty({ example: "https://res.cloudinary.com/edukids/audio/dog.mp3" })
  audioUrl: string;

  @ApiProperty({
    example: "Pronunciation recorded for improvement",
    required: false,
  })
  hint?: string;
}

export class DragDropActivityResponseDto {
  @ApiProperty({ example: 1 })
  activityId: number;

  @ApiProperty({
    description: "Feedback on the answer",
    type: FeedbackDto,
  })
  feedback: FeedbackDto;

  @ApiProperty({
    example: false,
    description: "Audio playback failed, use TTS fallback",
  })
  audioPlaybackFailed: boolean;

  @ApiProperty({
    example: 100,
    description: "Child total points after this interaction",
  })
  totalPoints: number;

  @ApiProperty({ example: 1, description: "Current level based on points" })
  currentLevel: number;
}
