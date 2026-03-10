import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { CmsController } from "./controller/cms.controller";
import { CmsService } from "./service/cms.service";
import { CmsRepository } from "./repository/cms.repository";

@Module({
  imports: [PrismaModule],
  controllers: [CmsController],
  providers: [CmsService, CmsRepository],
  exports: [CmsService],
})
export class CmsModule {}
