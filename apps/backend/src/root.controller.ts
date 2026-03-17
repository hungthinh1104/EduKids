import { Controller, Get } from "@nestjs/common";

@Controller()
export class RootController {
  @Get()
  getRoot() {
    return {
      statusCode: 200,
      message: "EduKids Backend API",
      docs: "/api",
      health: "/api/system/health",
      timestamp: new Date().toISOString(),
    };
  }
}
