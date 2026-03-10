import { Controller } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ChildService } from "./child.service";

@ApiTags("Children")
@ApiBearerAuth("JWT-auth")
@Controller("children")
export class ChildController {
  constructor(private readonly childService: ChildService) {}

  // @ApiOperation({ summary: 'Get all children under parent' })
  // @ApiResponse({ status: 200, description: 'List of children' })
  // @Get()
  // async getChildren() { }

  // @ApiOperation({ summary: 'Create new child profile' })
  // @ApiResponse({ status: 201, description: 'Child profile created' })
  // @ApiResponse({ status: 400, description: 'Invalid input' })
  // @Throttle(20, 60) // 20 child creations per 60 seconds
  // @Post()
  // async createChild() { }

  // @ApiOperation({ summary: 'Get child profile by ID' })
  // @ApiResponse({ status: 200, description: 'Child profile' })
  // @ApiResponse({ status: 403, description: 'Not owner' })
  // @ApiResponse({ status: 404, description: 'Child not found' })
  // @Get(':id')
  // async getChild() { }

  // @ApiOperation({ summary: 'Update child profile' })
  // @Patch(':id')
  // async updateChild() { }

  // @ApiOperation({ summary: 'Delete child profile' })
  // @Delete(':id')
  // async deleteChild() { }
}
