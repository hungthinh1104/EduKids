import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsBoolean, Min } from "class-validator";

export class UpdateProgressDto {
  @ApiProperty({ example: 1, description: "Vocabulary ID that was viewed" })
  @IsInt()
  vocabularyId: number;

  @ApiProperty({
    example: true,
    description: "Mark as completed",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export class LogVideoActivityDto {
  @ApiProperty({ example: 3, description: "Topic ID the video belongs to" })
  @IsInt()
  topicId: number;

  @ApiProperty({ example: 120, description: "Actual watch time in seconds", required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSec?: number;
}

export class VideoActivityResponseDto {
  @ApiProperty({ example: 1 })
  childId: number;

  @ApiProperty({ example: 3 })
  topicId: number;

  @ApiProperty({ example: 120 })
  durationSec: number;

  @ApiProperty({ example: "Video activity logged" })
  message: string;
}

export class ProgressResponseDto {
  @ApiProperty({ example: 1 })
  childId: number;

  @ApiProperty({ example: 1 })
  vocabularyId: number;

  @ApiProperty({ example: "2024-01-01T00:00:00.000Z", required: false })
  completedAt?: Date;

  @ApiProperty({ example: "Progress updated successfully" })
  message: string;
}
