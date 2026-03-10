import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class TopicDto {
  @ApiProperty({ example: 1, description: "Topic ID" })
  id: number;

  @ApiProperty({ example: "Animals", description: "Topic name" })
  @IsString()
  name: string;

  @ApiProperty({
    example: "Learn about different animals",
    description: "Topic description",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 15, description: "Total vocabulary count" })
  vocabularyCount?: number;

  @ApiProperty({ example: "2024-01-01T00:00:00.000Z" })
  createdAt: Date;
}
