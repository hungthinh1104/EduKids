import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { SystemController } from "./system.controller";
import { SystemService } from "./system.service";

describe("SystemController", () => {
  let controller: SystemController;

  const systemServiceMock = {
    getHealth: jest.fn() as jest.Mock,
    getVersion: jest.fn() as jest.Mock,
    getFeatureFlags: jest.fn() as jest.Mock,
    debugSentry: jest.fn() as jest.Mock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemController],
      providers: [{ provide: SystemService, useValue: systemServiceMock }],
    }).compile();

    controller = module.get<SystemController>(SystemController);
  });

  it("health delegates to service", () => {
    const expected = { status: "ok" };
    systemServiceMock.getHealth.mockReturnValue(expected);

    const result = controller.health();

    expect(systemServiceMock.getHealth).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it("version delegates to service", () => {
    const expected = { version: "1.0.0" };
    systemServiceMock.getVersion.mockReturnValue(expected);

    const result = controller.version();

    expect(systemServiceMock.getVersion).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it("getFeatureFlags delegates to service", () => {
    const expected = { adaptiveQuiz: true };
    systemServiceMock.getFeatureFlags.mockReturnValue(expected);

    const result = controller.getFeatureFlags();

    expect(systemServiceMock.getFeatureFlags).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it("debugSentry delegates to service", () => {
    const expected = { message: "Sentry event captured" };
    systemServiceMock.debugSentry.mockReturnValue(expected);

    const result = controller.debugSentry();

    expect(systemServiceMock.debugSentry).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });
});
