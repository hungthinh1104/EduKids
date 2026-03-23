import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { FlashcardService } from "./flashcard.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { DragDropActivityDto, FlashcardDto } from "./dto/flashcard.dto";
import { DragDropActivityResponseDto } from "./dto/flashcard.dto";

@ApiTags("Flashcard")
@ApiBearerAuth("JWT-auth")
@Controller("flashcard")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FlashcardController {
  constructor(private readonly flashcardService: FlashcardService) {}

  /**
   * UC-02: Get flashcard for vocabulary
   * Main Success Scenario Step 1: System displays flashcard (image + text + audio)
   * Accessible only by LEARNER role (child)
   */
  @Get(":vocabularyId")
  @Roles("LEARNER")
  @ApiOperation({
    summary: "Get flashcard for vocabulary",
    description:
      "UC-02 Main Step 1: Display high-quality image flashcard with native audio and drag-drop options. Returns vocabulary data with image, audio, and multiple choice options.",
  })
  @ApiParam({
    name: "vocabularyId",
    description: "Vocabulary ID",
    type: "number",
  })
  @ApiResponse({
    status: 200,
    description: "Flashcard retrieved successfully",
    type: FlashcardDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token missing or invalid",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Requires LEARNER role",
  })
  @ApiResponse({
    status: 404,
    description: "Vocabulary not found",
  })
  async getFlashcard(
    @Param("vocabularyId", ParseIntPipe) vocabularyId: number,
  ): Promise<FlashcardDto & { options: Array<{ id: number; text: string }> }> {
    return await this.flashcardService.getFlashcard(vocabularyId);
  }

  /**
   * UC-02: Submit drag-drop activity response
   * Main Success Scenario Step 3-4: Child performs drag-drop, gets immediate feedback
   * Post-conditions: Interaction results saved, Star Points awarded
   */
  @Post(":vocabularyId/drag-drop")
  @Roles("LEARNER")
  @ApiOperation({
    summary: "Submit drag-drop activity response",
    description:
      "UC-02 Main Steps 3-4: Child drags option to drop zone. System validates answer, generates immediate feedback, awards star points, and updates progress.",
  })
  @ApiParam({
    name: "vocabularyId",
    description: "Vocabulary ID",
    type: "number",
  })
  @ApiResponse({
    status: 200,
    description: "Activity submitted, feedback generated",
    type: DragDropActivityResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad Request - Invalid option or activity data",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - JWT token missing or invalid",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Requires LEARNER role",
  })
  @ApiResponse({
    status: 404,
    description: "Vocabulary not found",
  })
  async submitDragDropActivity(
    @Param("vocabularyId", ParseIntPipe) vocabularyId: number,
    @Body() dto: DragDropActivityDto,
    @Request() req,
  ): Promise<DragDropActivityResponseDto> {
    const childId = req.user?.childId;

    if (!childId) {
      throw new HttpException(
        "Child profile required. Please switch to child profile first (POST /api/profiles/switch).",
        HttpStatus.FORBIDDEN,
      );
    }

    // Validate vocabularyId matches
    if (dto.vocabularyId !== vocabularyId) {
      throw new HttpException("Vocabulary ID mismatch", HttpStatus.BAD_REQUEST);
    }

    return await this.flashcardService.submitDragDropActivity(childId, dto);
  }
}
