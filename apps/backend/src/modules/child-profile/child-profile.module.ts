import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ChildProfileController } from "./child-profile.controller";
import { ChildProfileService } from "./child-profile.service";
import { ChildProfileRepository } from "./child-profile.repository";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * UC-06: Manage Multi-Child Profiles Module
 * Parent creates and switches between multiple child profiles
 */
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "15m" },
      }),
    }),
  ],
  controllers: [ChildProfileController],
  providers: [ChildProfileService, ChildProfileRepository, PrismaService],
  exports: [ChildProfileService, ChildProfileRepository],
})
export class ChildProfileModule {}
