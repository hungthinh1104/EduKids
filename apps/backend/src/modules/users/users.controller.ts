import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UsersService } from "./users.service";

@ApiTags("Admin Users")
@Controller("admin/users")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles("ADMIN")
  @ApiOperation({
    summary: "Get parent users for admin management",
  })
  @ApiResponse({
    status: 200,
    description: "Parent users retrieved successfully",
  })
  async getAdminUsers() {
    const items = await this.usersService.getAdminUsers();

    return {
      data: items,
      meta: {
        total: items.length,
      },
    };
  }
}
