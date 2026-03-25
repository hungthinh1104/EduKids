import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UnauthorizedException } from "@nestjs/common";
import { ValidationController } from "./validation.controller";
import { ContentValidationService } from "../service/content-validation.service";
import { ApprovalService } from "../service/approval.service";
import { PreviewService } from "../service/preview.service";
import { ValidationRepository } from "../repository/validation.repository";

describe("ValidationController", () => {
  let controller: ValidationController;

  const contentValidationServiceMock = {
    validateContent: jest.fn() as jest.Mock,
    batchValidateContent: jest.fn() as jest.Mock,
    getValidationResult: jest.fn() as jest.Mock,
    getContentValidationHistory: jest.fn() as jest.Mock,
    getAutoFlaggedContent: jest.fn() as jest.Mock,
    getValidationStats: jest.fn() as jest.Mock,
  };

  const approvalServiceMock = {
    approveContent: jest.fn() as jest.Mock,
    conditionalApprove: jest.fn() as jest.Mock,
    rejectContent: jest.fn() as jest.Mock,
    getPendingApprovals: jest.fn() as jest.Mock,
    getApprovalStats: jest.fn() as jest.Mock,
    getApprovalHistory: jest.fn() as jest.Mock,
    getRejectionHistory: jest.fn() as jest.Mock,
    bulkApprove: jest.fn() as jest.Mock,
    bulkReject: jest.fn() as jest.Mock,
  };

  const previewServiceMock = {
    generatePreview: jest.fn() as jest.Mock,
  };

  const validationRepositoryMock = {
    findLatestValidation: jest.fn() as jest.Mock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ValidationController],
      providers: [
        { provide: ContentValidationService, useValue: contentValidationServiceMock },
        { provide: ApprovalService, useValue: approvalServiceMock },
        { provide: PreviewService, useValue: previewServiceMock },
        { provide: ValidationRepository, useValue: validationRepositoryMock },
      ],
    }).compile();

    controller = module.get<ValidationController>(ValidationController);
  });

  it("validateContent throws UnauthorizedException for invalid jwt payload", async () => {
    await expect(
      controller.validateContent({ contentId: "c1" } as any, {} as any),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("validateContent delegates when actor is valid", async () => {
    const request = { contentId: "c1", contentText: "hello" };
    const expected = { validationId: "v1" };
    (contentValidationServiceMock.validateContent as any).mockResolvedValue(expected);

    const result = await controller.validateContent(request as any, { userId: 7 } as any);

    expect(contentValidationServiceMock.validateContent).toHaveBeenCalledWith(request);
    expect(result).toEqual(expected);
  });

  it("batchValidateContent returns wrapped batch response", async () => {
    (contentValidationServiceMock.batchValidateContent as any).mockResolvedValue([
      { isApproved: true },
      { isApproved: false },
    ]);

    const result = await controller.batchValidateContent(
      { items: [{ contentId: "1" }, { contentId: "2" }] } as any,
      { sub: "admin-1" } as any,
    );

    expect(result.totalItems).toBe(2);
    expect(result.successCount).toBe(1);
    expect(result.results).toHaveLength(2);
  });

  it("approveContent includes contentId and approvedBy", async () => {
    const expected = { success: true };
    (approvalServiceMock.approveContent as any).mockResolvedValue(expected);

    const result = await controller.approveContent(
      "content-9",
      { comments: "ok" } as any,
      { id: 123 } as any,
    );

    expect(approvalServiceMock.approveContent).toHaveBeenCalledWith(
      expect.objectContaining({ contentId: "content-9", approvedBy: "123" }),
    );
    expect(result).toEqual(expected);
  });

  it("getContentValidationHistory parses limit and delegates", async () => {
    (contentValidationServiceMock.getContentValidationHistory as any).mockResolvedValue([]);

    await controller.getContentValidationHistory("c-5", "25");
    await controller.getContentValidationHistory("c-5", undefined);

    expect(contentValidationServiceMock.getContentValidationHistory).toHaveBeenNthCalledWith(
      1,
      "c-5",
      25,
    );
    expect(contentValidationServiceMock.getContentValidationHistory).toHaveBeenNthCalledWith(
      2,
      "c-5",
      10,
    );
  });

  it("healthCheck returns service health payload", async () => {
    const result = await controller.healthCheck();

    expect(result).toEqual(
      expect.objectContaining({ status: "healthy", service: "media-validation" }),
    );
  });
});
