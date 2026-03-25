import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { BadRequestException, NotFoundException } from "@nestjs/common";
jest.mock("./report.service", () => ({
  ReportService: class ReportService {},
}));
import { ReportController } from "./report.controller";
import { ReportService } from "./report.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ReportRange } from "./report.dto";

describe("ReportController", () => {
  let controller: ReportController;

  const reportServiceMock = {
    generateReport: jest.fn() as jest.Mock,
    sendReport: jest.fn() as jest.Mock,
    subscribeToReports: jest.fn() as jest.Mock,
    unsubscribeFromReports: jest.fn() as jest.Mock,
    getPreferences: jest.fn() as jest.Mock,
    updatePreferences: jest.fn() as jest.Mock,
    getReportHistory: jest.fn() as jest.Mock,
    getUnreadNotifications: jest.fn() as jest.Mock,
    markNotificationAsRead: jest.fn() as jest.Mock,
  };

  const prismaMock = {
    childProfile: {
      findFirst: jest.fn() as jest.Mock,
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        { provide: ReportService, useValue: reportServiceMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    controller = module.get<ReportController>(ReportController);
  });

  it("generateReport checks ownership then delegates with default range", async () => {
    const dto = { childId: 5 };
    const expected = { id: "r1" };
    (prismaMock.childProfile.findFirst as any).mockResolvedValue({ id: 5 });
    (reportServiceMock.generateReport as any).mockResolvedValue(expected);

    const result = await controller.generateReport(10, dto as any);

    expect(reportServiceMock.generateReport).toHaveBeenCalledWith(10, 5, ReportRange.WEEK);
    expect(result).toEqual(expected);
  });

  it("generateReport throws NotFoundException when child not owned", async () => {
    (prismaMock.childProfile.findFirst as any).mockResolvedValue(null);

    await expect(controller.generateReport(10, { childId: 9 } as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("subscribeToReports validates email for EMAIL channel", async () => {
    await expect(
      controller.subscribeToReports(1, { preferredChannel: "EMAIL" } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it("subscribeToReports validates zalo number for ZALO channel", async () => {
    await expect(
      controller.subscribeToReports(1, { preferredChannel: "ZALO" } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it("getReportHistory validates invalid limit", async () => {
    await expect(controller.getReportHistory(3, "0")).rejects.toThrow(BadRequestException);
    await expect(controller.getReportHistory(3, "abc")).rejects.toThrow(BadRequestException);
  });

  it("markNotificationAsRead validates id and delegates", async () => {
    const expected = { id: "n1", isRead: true };
    (reportServiceMock.markNotificationAsRead as any).mockResolvedValue(expected);

    await expect(controller.markNotificationAsRead("" as any, 2)).rejects.toThrow(
      BadRequestException,
    );

    const result = await controller.markNotificationAsRead("n1", 2);
    expect(reportServiceMock.markNotificationAsRead).toHaveBeenCalledWith(2, "n1");
    expect(result).toEqual(expected);
  });
});
