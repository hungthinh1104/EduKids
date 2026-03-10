import { Module } from "@nestjs/common";
import { GamificationController } from "./gamification.controller";
import { GamificationService } from "./gamification.service";
import { GamificationRepository } from "./repositories/gamification.repository";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [GamificationController],
  providers: [GamificationService, GamificationRepository, PrismaService],
  exports: [GamificationService, GamificationRepository],
})
export class GamificationModule {}
