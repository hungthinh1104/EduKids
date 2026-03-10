import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class PaginationQueryDto {
  @ApiProperty({
    example: 1,
    description: "Page number (starts from 1)",
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ example: 20, description: "Items per page", required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;

  @ApiProperty({ isArray: true })
  items: T[];
}
