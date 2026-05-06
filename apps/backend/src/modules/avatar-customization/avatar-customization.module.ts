import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AvatarCustomizationService } from "./service/avatar-customization.service";
import { AvatarCustomizationController } from "./controller/avatar-customization.controller";
import { AvatarRepository } from "./repository/avatar.repository";
import { AvatarCacheService } from "./service/avatar-cache.service";

@Module({
  imports: [PrismaModule],
  providers: [AvatarCustomizationService, AvatarRepository, AvatarCacheService],
  controllers: [AvatarCustomizationController],
  exports: [AvatarCustomizationService, AvatarRepository],
})
export class AvatarCustomizationModule {}
