import { ApiProperty } from "@nestjs/swagger";

export class TopicEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Animals" })
  name: string;

  @ApiProperty({ example: "Learn about different animals", required: false })
  description?: string;

  @ApiProperty({ example: "2024-01-01T00:00:00.000Z" })
  createdAt: Date;
}
