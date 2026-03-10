import { ApiProperty } from "@nestjs/swagger";

export class FlashcardFeedbackOptionDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "chó" })
  text: string;

  @ApiProperty({ example: true, description: "Correct answer" })
  isCorrect: boolean;
}

export class FlashcardFeedbackResponseDto {
  @ApiProperty({ example: 1 })
  vocabularyId: number;

  @ApiProperty({ example: "dog" })
  word: string;

  @ApiProperty({ example: "chó" })
  translation: string;

  @ApiProperty({
    type: [FlashcardFeedbackOptionDto],
    description: "All options with correct answer revealed",
  })
  options: FlashcardFeedbackOptionDto[];

  @ApiProperty({ example: true })
  isCorrect: boolean;

  @ApiProperty({ example: "Perfect! That is correct." })
  message: string;

  @ApiProperty({ example: 10, description: "Star points earned" })
  pointsEarned: number;

  @ApiProperty({ example: "https://res.cloudinary.com/edukids/audio/dog.mp3" })
  pronunciationAudioUrl: string;
}

// Alias for backward compatibility
export class FeedbackDto extends FlashcardFeedbackResponseDto {}
