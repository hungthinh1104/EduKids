import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { MediaController } from "./media.controller";
import { MediaService } from "../service/media.service";

describe("MediaController", () => {
  let controller: MediaController;

  const mediaServiceMock = {
    uploadMedia: jest.fn() as jest.Mock,
    getMediaById: jest.fn() as jest.Mock,
    getProcessingStatus: jest.fn() as jest.Mock,
    getMediaList: jest.fn() as jest.Mock,
    deleteMedia: jest.fn() as jest.Mock,
    retryFailedMedia: jest.fn() as jest.Mock,
    getPendingMediaCount: jest.fn() as jest.Mock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [{ provide: MediaService, useValue: mediaServiceMock }],
    }).compile();

    controller = module.get<MediaController>(MediaController);
  });

  it("uploadMedia uses req.user.sub as adminId", async () => {
    const file = { originalname: "a.png" } as any;
    const dto = { mediaType: "IMAGE", context: "VOCABULARY" };
    const expected = { id: "m1" };
    (mediaServiceMock.uploadMedia as any).mockResolvedValue(expected);

    const result = await controller.uploadMedia(file, dto as any, {
      user: { sub: 42 },
    } as any);

    expect(mediaServiceMock.uploadMedia).toHaveBeenCalledWith(file, dto, "42");
    expect(result).toEqual(expected);
  });

  it("deleteMedia passes id and adminId from sub", async () => {
    (mediaServiceMock.deleteMedia as any).mockResolvedValue(undefined);

    await controller.deleteMedia("m99", { user: { sub: 8 } } as any);

    expect(mediaServiceMock.deleteMedia).toHaveBeenCalledWith("m99", "8");
  });

  it("retryFailedMedia returns success message", async () => {
    (mediaServiceMock.retryFailedMedia as any).mockResolvedValue(undefined);

    const result = await controller.retryFailedMedia("m1");

    expect(mediaServiceMock.retryFailedMedia).toHaveBeenCalledWith("m1");
    expect(result).toEqual({ message: "Media re-queued for processing" });
  });

  it("getPendingCount wraps count in object", async () => {
    (mediaServiceMock.getPendingMediaCount as any).mockResolvedValue(5);

    const result = await controller.getPendingCount();

    expect(result).toEqual({ pendingCount: 5 });
  });
});
