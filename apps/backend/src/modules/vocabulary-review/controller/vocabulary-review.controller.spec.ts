import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import { VocabularyReviewController } from "./vocabulary-review.controller";
import { VocabularyReviewService } from "../service/vocabulary-review.service";

describe("VocabularyReviewController", () => {
  let controller: VocabularyReviewController;

  const reviewServiceMock = {
    getReviewSession: jest.fn() as jest.Mock,
    submitReview: jest.fn() as jest.Mock,
    submitBulkReviews: jest.fn() as jest.Mock,
    getProgress: jest.fn() as jest.Mock,
    getStatistics: jest.fn() as jest.Mock,
    getHistory: jest.fn() as jest.Mock,
    getMasteredVocabulary: jest.fn() as jest.Mock,
    getSuggestions: jest.fn() as jest.Mock,
    getAllReviewItems: jest.fn() as jest.Mock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VocabularyReviewController],
      providers: [
        { provide: VocabularyReviewService, useValue: reviewServiceMock },
      ],
    }).compile();

    controller = module.get<VocabularyReviewController>(
      VocabularyReviewController,
    );
  });

  it("getReviewSession throws when childId missing", async () => {
    await expect(
      controller.getReviewSession({ user: {} } as any, undefined),
    ).rejects.toThrow(BadRequestException);
  });

  it("getReviewSession uses default limit 20", async () => {
    (reviewServiceMock.getReviewSession as any).mockResolvedValue({
      items: [],
    });

    await controller.getReviewSession(
      { user: { childId: 3 } } as any,
      undefined,
    );

    expect(reviewServiceMock.getReviewSession).toHaveBeenCalledWith(3, 20);
  });

  it("submitBulkReviews validates payload format", async () => {
    await expect(
      controller.submitBulkReviews(
        { user: { childId: 3 } } as any,
        { foo: [] } as any,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it("submitBulkReviews accepts array body", async () => {
    const reviews = [{ vocabularyId: 1, quality: 4 }];
    (reviewServiceMock.submitBulkReviews as any).mockResolvedValue([
      { success: true },
    ]);

    const result = await controller.submitBulkReviews(
      { user: { childId: 3 } } as any,
      reviews as any,
    );

    expect(reviewServiceMock.submitBulkReviews).toHaveBeenCalledWith(
      3,
      reviews,
    );
    expect(result).toEqual([{ success: true }]);
  });

  it("submitBulkReviews accepts { reviews } body", async () => {
    const reviews = [{ vocabularyId: 2, quality: 5 }];
    (reviewServiceMock.submitBulkReviews as any).mockResolvedValue([
      { success: true },
    ]);

    await controller.submitBulkReviews(
      { user: { childId: 3 } } as any,
      { reviews } as any,
    );

    expect(reviewServiceMock.submitBulkReviews).toHaveBeenCalledWith(
      3,
      reviews,
    );
  });
});
