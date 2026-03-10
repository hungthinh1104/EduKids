import { ApiProperty } from "@nestjs/swagger";

export class VocabularyEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  topicId: number;

  @ApiProperty({ example: "dog" })
  word: string;

  @ApiProperty({ example: "/dɒɡ/", required: false })
  phonetic?: string;

  @ApiProperty({ example: "chó", required: false })
  translation?: string;

  @ApiProperty({ example: "noun", required: false })
  partOfSpeech?: string;

  @ApiProperty({ example: "I have a dog.", required: false })
  exampleSentence?: string;

  @ApiProperty({ example: 1, required: false })
  difficulty?: number;

  @ApiProperty({ example: "2024-01-01T00:00:00.000Z" })
  createdAt: Date;
}
