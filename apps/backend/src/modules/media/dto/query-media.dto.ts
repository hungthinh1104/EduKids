import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { MediaType, MediaContext } from './upload-media.dto';
import { ProcessingStatus } from './media-response.dto';

export class QueryMediaDto {
  @ApiProperty({
    description: 'Filter by media type',
    enum: MediaType,
    required: false,
    example: MediaType.IMAGE,
  })
  @IsEnum(MediaType)
  @IsOptional()
  mediaType?: MediaType;

  @ApiProperty({
    description: 'Filter by context',
    enum: MediaContext,
    required: false,
    example: MediaContext.VOCABULARY,
  })
  @IsEnum(MediaContext)
  @IsOptional()
  context?: MediaContext;

  @ApiProperty({
    description: 'Filter by processing status',
    enum: ProcessingStatus,
    required: false,
    example: ProcessingStatus.COMPLETED,
  })
  @IsEnum(ProcessingStatus)
  @IsOptional()
  status?: ProcessingStatus;

  @ApiProperty({
    description: 'Filter by uploader admin ID',
    required: false,
    example: 'admin123',
  })
  @IsString()
  @IsOptional()
  uploadedBy?: string;

  @ApiProperty({
    description: 'Page number (1-indexed)',
    required: false,
    example: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page',
    required: false,
    example: 20,
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
