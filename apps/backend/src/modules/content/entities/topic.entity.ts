import { ApiProperty } from "@nestjs/swagger";

export class TopicEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Animals" })
  name: string;

  @ApiProperty({ example: "Learn about different animals", required: false })
  description?: string;

  @ApiProperty({
    example: "https://res.cloudinary.com/edukids/image/topic-animals.jpg",
    required: false,
  })
  imageUrl?: string;

  @ApiProperty({ example: 1, required: false })
  learningLevel?: number;

  @ApiProperty({ example: ["animals", "basic"], required: false, type: [String] })
  tags?: string[];

  @ApiProperty({ example: "2024-01-01T00:00:00.000Z" })
  createdAt: Date;
}
