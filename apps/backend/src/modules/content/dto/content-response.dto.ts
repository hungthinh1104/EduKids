import { ApiProperty } from "@nestjs/swagger";
import { TopicDto } from "./topic.dto";
import { VocabularyDto } from "./vocabulary.dto";

export class TopicListResponseDto {
  @ApiProperty({ type: [TopicDto] })
  topics: TopicDto[];

  @ApiProperty({ example: 10 })
  total: number;
}

export class TopicDetailResponseDto {
  @ApiProperty({ type: TopicDto })
  topic: TopicDto;

  @ApiProperty({ type: [VocabularyDto], description: "Flashcards with media" })
  vocabularies: VocabularyDto[];

  @ApiProperty({
    example: "https://res.cloudinary.com/edukids/video/animals-intro.mp4",
    description:
      "Short animated video lesson URL (from first VIDEO type media)",
    required: false,
  })
  videoUrl?: string;

  @ApiProperty({
    example: 5,
    description: "Number of completed vocabulary items",
  })
  completedCount: number;

  @ApiProperty({ example: 33.33, description: "Completion percentage" })
  progressPercentage: number;
}

export class MediaLoadErrorDto {
  @ApiProperty({ example: "MEDIA_LOAD_FAILED" })
  errorCode: string;

  @ApiProperty({ example: "Connection is slow, try again!" })
  message: string;

  @ApiProperty({
    example: "https://res.cloudinary.com/edukids/image/placeholder.png",
  })
  placeholderUrl: string;
}
