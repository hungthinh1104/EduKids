import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { HttpException, HttpStatus } from "@nestjs/common";
import { ContentController } from "./content.controller";
import { ContentService } from "./content.service";

describe("ContentController", () => {
  let controller: ContentController;

  const contentServiceMock = {
    getTopicsPaginated: jest.fn() as jest.Mock,
    getTopicById: jest.fn() as jest.Mock,
    getVocabularyById: jest.fn() as jest.Mock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentController],
      providers: [{ provide: ContentService, useValue: contentServiceMock }],
    }).compile();

    controller = module.get<ContentController>(ContentController);
  });

  it("getTopics uses childId for learner", async () => {
    const expected = { data: [], pagination: {} };
    (contentServiceMock.getTopicsPaginated as any).mockResolvedValue(expected);

    const req = { user: { role: "LEARNER", childId: 7 } };
    const result = await controller.getTopics(1, 20, req as any);

    expect(contentServiceMock.getTopicsPaginated).toHaveBeenCalledWith(1, 20, 7);
    expect(result).toEqual(expected);
  });

  it("getTopics passes undefined childId for parent", async () => {
    (contentServiceMock.getTopicsPaginated as any).mockResolvedValue({
      data: [],
    });

    const req = { user: { role: "PARENT" } };
    await controller.getTopics(2, 10, req as any);

    expect(contentServiceMock.getTopicsPaginated).toHaveBeenCalledWith(
      2,
      10,
      undefined,
    );
  });

  it("getTopicById throws FORBIDDEN when childId is missing", async () => {
    await expect(controller.getTopicById(1, { user: {} } as any)).rejects.toThrow(
      HttpException,
    );

    await expect(controller.getTopicById(1, { user: {} } as any)).rejects.toMatchObject(
      {
        status: HttpStatus.FORBIDDEN,
      },
    );
  });

  it("getTopicById maps media loading error to internal server error", async () => {
    (contentServiceMock.getTopicById as any).mockRejectedValue(
      new Error("Connection is slow, try again!"),
    );

    await expect(
      controller.getTopicById(3, { user: { childId: 9 } } as any),
    ).rejects.toMatchObject({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      response: expect.objectContaining({
        errorCode: "MEDIA_LOAD_FAILED",
      }),
    });
  });

  it("getVocabularyById delegates to service", async () => {
    const expected = { id: 11, word: "dog" };
    (contentServiceMock.getVocabularyById as any).mockResolvedValue(expected);

    const result = await controller.getVocabularyById(11);

    expect(contentServiceMock.getVocabularyById).toHaveBeenCalledWith(11);
    expect(result).toEqual(expected);
  });
});
