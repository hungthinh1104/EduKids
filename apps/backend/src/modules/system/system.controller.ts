import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { SkipThrottle } from "../../common/decorators/throttle.decorator";
import { SystemService } from "./system.service";

@ApiTags("System")
@Controller("system")
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @ApiOperation({ summary: "Health check endpoint" })
  @ApiResponse({ status: 200, description: "Service is healthy" })
  @SkipThrottle()
  @Get("health")
  health() {
    return this.systemService.getHealth();
  }

  @ApiOperation({ summary: "Get system version" })
  @SkipThrottle()
  @Get("version")
  version() {
    return this.systemService.getVersion();
  }

  @ApiOperation({ summary: "Get feature flags" })
  @Get("feature-flags")
  @SkipThrottle()
  getFeatureFlags() {
    return this.systemService.getFeatureFlags();
  }

  // @ApiOperation({ summary: 'Get system configuration' })
  // @ApiBearerAuth('JWT-auth')
  // @Get('config')
  // async getConfig() { }

  // @ApiOperation({ summary: 'Update system config (Admin only)' })
  // @ApiBearerAuth('JWT-auth')
  // @Patch('config')
  // async updateConfig() { }
}
