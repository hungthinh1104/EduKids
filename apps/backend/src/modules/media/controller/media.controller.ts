import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { MediaService } from '../service/media.service';
import { UploadMediaDto } from '../dto/upload-media.dto';
import { MediaResponseDto, MediaListResponseDto, ProcessingStatusResponseDto } from '../dto/media-response.dto';
import { QueryMediaDto } from '../dto/query-media.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Media Management')
@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) { }

  @Post('upload')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload media file',
    description: 'Admin uploads image, audio, or video file for async processing',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'mediaType', 'context'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Media file to upload',
        },
        mediaType: {
          type: 'string',
          enum: ['IMAGE', 'AUDIO', 'VIDEO'],
          description: 'Type of media',
        },
        context: {
          type: 'string',
          enum: ['VOCABULARY', 'TOPIC', 'QUIZ', 'PROFILE', 'GENERAL'],
          description: 'Usage context',
        },
        description: {
          type: 'string',
          description: 'Optional description',
        },
        altText: {
          type: 'string',
          description: 'Optional alt text for accessibility',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Media uploaded successfully and queued for processing',
    type: MediaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type or size exceeds limit',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadMediaDto,
    @Req() req: any,
  ): Promise<MediaResponseDto> {
    // [H-3 Fix] JwtStrategy attaches userId as `sub`, not `userId`
    const adminId = req.user.sub;
    return this.mediaService.uploadMedia(file, uploadDto, adminId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get media by ID',
    description: 'Retrieve media details including processing status and URLs',
  })
  @ApiResponse({
    status: 200,
    description: 'Media details retrieved successfully',
    type: MediaResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Media not found',
  })
  async getMediaById(@Param('id') id: string): Promise<MediaResponseDto> {
    return this.mediaService.getMediaById(id);
  }

  @Get(':id/status')
  @ApiOperation({
    summary: 'Get processing status',
    description: 'Check real-time processing status with progress percentage',
  })
  @ApiResponse({
    status: 200,
    description: 'Processing status retrieved successfully',
    type: ProcessingStatusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Media not found',
  })
  async getProcessingStatus(@Param('id') id: string): Promise<ProcessingStatusResponseDto> {
    return this.mediaService.getProcessingStatus(id);
  }

  @Get()
  @ApiOperation({
    summary: 'List media with filters',
    description: 'Get paginated list of media with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Media list retrieved successfully',
    type: MediaListResponseDto,
  })
  async getMediaList(@Query() queryDto: QueryMediaDto): Promise<MediaListResponseDto> {
    return this.mediaService.getMediaList(queryDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete media',
    description: 'Delete media from database and cloud storage (admin only)',
  })
  @ApiResponse({
    status: 204,
    description: 'Media deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Media not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async deleteMedia(@Param('id') id: string, @Req() req: any): Promise<void> {
    // [H-3 Fix] JwtStrategy attaches userId as `sub`, not `userId`
    const adminId = req.user.sub;
    await this.mediaService.deleteMedia(id, adminId);
  }

  @Post(':id/retry')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retry failed processing',
    description: 'Retry processing for failed media (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Media re-queued for processing',
  })
  @ApiResponse({
    status: 400,
    description: 'Media is not in failed status',
  })
  @ApiResponse({
    status: 404,
    description: 'Media not found',
  })
  async retryFailedMedia(@Param('id') id: string): Promise<{ message: string }> {
    await this.mediaService.retryFailedMedia(id);
    return { message: 'Media re-queued for processing' };
  }

  @Get('stats/pending')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get pending media count',
    description: 'Get count of media pending or in processing (monitoring)',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending count retrieved',
    schema: {
      type: 'object',
      properties: {
        pendingCount: { type: 'number', example: 5 },
      },
    },
  })
  async getPendingCount(): Promise<{ pendingCount: number }> {
    const pendingCount = await this.mediaService.getPendingMediaCount();
    return { pendingCount };
  }
}
