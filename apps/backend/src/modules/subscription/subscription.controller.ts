import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { RequestWithUser } from "../../common/types/jwt-user.type";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { SubscriptionService } from "./subscription.service";
import { UpgradeSubscriptionDto } from "./subscription.dto";

@ApiTags("Subscription")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("subscription")
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  @Roles("PARENT")
  @ApiOperation({ summary: "Get current subscription" })
  async getSubscription(@Request() req: RequestWithUser) {
    return this.subscriptionService.getSubscription(req.user.userId);
  }

  @Post("upgrade")
  @Roles("PARENT")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Upgrade subscription plan" })
  async upgradePlan(
    @Request() req: RequestWithUser,
    @Body() dto: UpgradeSubscriptionDto,
  ) {
    return this.subscriptionService.upgradePlan(req.user.userId, dto);
  }

  @Delete()
  @Roles("PARENT")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel subscription" })
  async cancelSubscription(@Request() req: RequestWithUser) {
    return this.subscriptionService.cancelSubscription(req.user.userId);
  }
}
