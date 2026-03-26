import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { CmsController } from "./cms.controller";
import { CmsService } from "../service/cms.service";
import { ContentStatus } from "../dto/create-topic.dto";

describe("CmsController", () => {
  let controller: CmsController;

  const cmsServiceMock = {
    createTopic: jest.fn() as jest.Mock,
    getAllTopics: jest.fn() as jest.Mock,
    updateTopic: jest.fn() as jest.Mock,
    deleteTopic: jest.fn() as jest.Mock,
    publishTopic: jest.fn() as jest.Mock,
    createVocabulary: jest.fn() as jest.Mock,
    getVocabulariesByTopicId: jest.fn() as jest.Mock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CmsController],
      providers: [{ provide: CmsService, useValue: cmsServiceMock }],
    }).compile();

    controller = module.get<CmsController>(CmsController);
  });

  it("createTopic uses req.user.userId", async () => {
    const dto = { title: "Animals" };
    (cmsServiceMock.createTopic as any).mockResolvedValue({ id: 1 });

    const result = await controller.createTopic(
      dto as any,
      {
        user: { userId: 77 },
      } as any,
    );

    expect(cmsServiceMock.createTopic).toHaveBeenCalledWith(dto, 77);
    expect(result).toEqual({ id: 1 });
  });

  it("updateTopic uses req.user.sub fallback", async () => {
    const dto = { title: "Updated" };
    (cmsServiceMock.updateTopic as any).mockResolvedValue({ id: 2 });

    const result = await controller.updateTopic(
      2 as any,
      dto as any,
      {
        user: { sub: 88 },
      } as any,
    );

    expect(cmsServiceMock.updateTopic).toHaveBeenCalledWith(2, dto, 88);
    expect(result).toEqual({ id: 2 });
  });

  it("deleteTopic uses req.user.id fallback", async () => {
    (cmsServiceMock.deleteTopic as any).mockResolvedValue({ success: true });

    const result = await controller.deleteTopic(
      3 as any,
      {
        user: { id: 99 },
      } as any,
    );

    expect(cmsServiceMock.deleteTopic).toHaveBeenCalledWith(3, 99);
    expect(result).toEqual({ success: true });
  });

  it("getAllTopics uses defaults and passes status", async () => {
    (cmsServiceMock.getAllTopics as any).mockResolvedValue({ items: [] });

    await controller.getAllTopics(
      undefined as any,
      undefined as any,
      undefined,
    );
    await controller.getAllTopics(2 as any, 30 as any, ContentStatus.PUBLISHED);

    expect(cmsServiceMock.getAllTopics).toHaveBeenNthCalledWith(
      1,
      1,
      10,
      undefined,
    );
    expect(cmsServiceMock.getAllTopics).toHaveBeenNthCalledWith(
      2,
      2,
      30,
      ContentStatus.PUBLISHED,
    );
  });

  it("getVocabulariesByTopicId uses default pagination", async () => {
    (cmsServiceMock.getVocabulariesByTopicId as any).mockResolvedValue({
      items: [],
    });

    await controller.getVocabulariesByTopicId(
      10 as any,
      undefined as any,
      undefined as any,
    );

    expect(cmsServiceMock.getVocabulariesByTopicId).toHaveBeenCalledWith(
      10,
      1,
      20,
    );
  });
});
