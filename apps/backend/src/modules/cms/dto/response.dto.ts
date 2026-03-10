import { ApiProperty } from "@nestjs/swagger";

export class TopicResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Animals" })
  name: string;

  @ApiProperty({ example: "Learn about different animals" })
  description: string;

  @ApiProperty({ example: 1 })
  learningLevel: number;

  @ApiProperty({
    example: "https://cdn.example.com/animals.jpg",
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty({ example: "PUBLISHED" })
  status: string;

  @ApiProperty({ example: ["education", "vocabulary", "beginner"] })
  tags: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ example: 1 })
  createdBy: number;
}

export class VocabularyResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  topicId: number;

  @ApiProperty({ example: "Lion" })
  word: string;

  @ApiProperty({ example: "A large carnivorous feline" })
  definition: string;

  @ApiProperty({ example: "A large wild cat with a mane", nullable: true })
  example: string | null;

  @ApiProperty({ example: "https://cdn.example.com/lion.jpg", nullable: true })
  imageUrl: string | null;

  @ApiProperty({ example: "https://cdn.example.com/lion.mp3", nullable: true })
  audioUrl: string | null;

  @ApiProperty({ example: "PUBLISHED" })
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class QuizStructureResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  topicId: number;

  @ApiProperty({ example: "Animal Quiz 1" })
  title: string;

  @ApiProperty({ example: "Test your knowledge about animals" })
  description: string;

  @ApiProperty({ example: "What is the largest land animal?" })
  questionText: string;

  @ApiProperty({
    example: [
      { text: "Lion", isCorrect: false },
      { text: "Elephant", isCorrect: true },
    ],
  })
  options: Array<{ text: string; isCorrect: boolean }>;

  @ApiProperty({ example: 3 })
  difficultyLevel: number;

  @ApiProperty({ example: "PUBLISHED" })
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AuditLogResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  adminId: number;

  @ApiProperty({ example: "CREATE_TOPIC" })
  action: string;

  @ApiProperty({ example: "topic" })
  entityType: string;

  @ApiProperty({ example: 1 })
  entityId: number;

  @ApiProperty({
    example: { name: "Animals", description: "Learn about animals" },
  })
  changes: Record<string, unknown>;

  @ApiProperty()
  timestamp: Date;
}

export class ContentPublishResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "topic" })
  entityType: string;

  @ApiProperty({ example: "PUBLISHED" })
  status: string;

  @ApiProperty({ example: true })
  published: boolean;

  @ApiProperty()
  publishedAt: Date;

  @ApiProperty({ example: 1 })
  publishedBy: number;
}
